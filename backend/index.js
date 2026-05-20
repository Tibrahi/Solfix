import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { MongoClient, ObjectId } from 'mongodb';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ============================================================================
// CORS Configuration - Production-Safe Dynamic Origin Handling
// ============================================================================

/**
 * Dynamic CORS origin validation
 * 
 * This function validates incoming origins against a list of allowed patterns.
 * It supports:
 * - Exact matches (e.g., 'http://localhost:5173')
 * - Wildcard subdomains (e.g., '*.vercel.app')
 * - Environment variable configured origins
 * - Render preview URLs (e.g., 'solfix-frontend-abc123.onrender.com')
 */
const allowedOrigins = (() => {
  const origins = [];

  // Add origins from environment variable (comma-separated)
  // In production, this should contain your frontend domain(s)
  if (process.env.ALLOWED_ORIGINS) {
    const envOrigins = process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim());
    origins.push(...envOrigins);
  }

  // Add development origins only in non-production environment
  if (process.env.NODE_ENV !== 'production') {
    origins.push(
      'http://localhost:5173',
      'http://localhost:3000',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:3000'
    );
  }

  // Add Render URLs if BACKEND_URL is set
  if (process.env.BACKEND_URL) {
    const backendUrl = process.env.BACKEND_URL.replace(/\/$/, '');
    origins.push(backendUrl);
  }

  // Add common Vercel preview patterns
  origins.push(/https:\/\/[\w-]+\.vercel\.app$/);
  origins.push(/https:\/\/[\w-]+\.onrender\.com$/);

  return origins;
})();

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) {
      return callback(null, true);
    }

    // Check against allowed origins
    const isAllowed = allowedOrigins.some(allowed => {
      if (typeof allowed === 'string') {
        return allowed === origin;
      }
      if (allowed instanceof RegExp) {
        return allowed.test(origin);
      }
      return false;
    });

    if (isAllowed) {
      callback(null, true);
    } else {
      console.warn(`[CORS] Blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  optionsSuccessStatus: 200,
  maxAge: 86400 // 24 hours cache for preflight
};

// Apply CORS middleware
app.use(cors(corsOptions));

// ============================================================================
// Request Logging Middleware
// ============================================================================

app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
  });
  next();
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ============================================================================
// MongoDB Connection
// ============================================================================

let db;
let applicantsCollection;
let adminsCollection;
let sessionsCollection;
let mongoClient;

const connectToMongoDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    
    if (!mongoUri || mongoUri.includes('<username>') || mongoUri.includes('<password>')) {
      console.warn('⚠️  MongoDB URI not configured. Please update the MONGODB_URI in .env file with your MongoDB Atlas connection string.');
      console.warn('⚠️  The application will run with limited functionality until MongoDB is configured.');
      return false;
    }

    mongoClient = new MongoClient(mongoUri);
    await mongoClient.connect();
    console.log('✅ Connected to MongoDB Atlas');
    
    db = mongoClient.db();
    applicantsCollection = db.collection('applicants');
    adminsCollection = db.collection('admins');
    sessionsCollection = db.collection('sessions');
    
    // Create indexes for better performance
    await applicantsCollection.createIndex({ submittedAt: -1 });
    await applicantsCollection.createIndex({ email: 1 });
    await applicantsCollection.createIndex({ status: 1 });
    await sessionsCollection.createIndex({ token: 1 }, { unique: true });
    await sessionsCollection.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
    
    return true;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    return false;
  }
};

// In-memory fallback storage (when MongoDB is not configured)
const inMemoryApplicants = [];
const inMemorySessions = new Map();
let adminCredentials = null;
let isMongoConnected = false;

// ============================================================================
// Admin Credentials Management
// ============================================================================

const initializeAdmin = async () => {
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@solfix.com';
  const adminPhone = process.env.ADMIN_PHONE || '+1234567890';
  const adminUsername = process.env.ADMIN_USERNAME || 'admin';

  if (!process.env.ADMIN_PASSWORD) {
    console.warn('⚠️  ADMIN_PASSWORD not set. Using default password "admin123". Please set ADMIN_PASSWORD in environment variables for production.');
  }

  const hashedPassword = await bcrypt.hash(adminPassword, 12);
  adminCredentials = {
    id: 'admin-001',
    email: adminEmail,
    phone: adminPhone,
    username: adminUsername,
    password: hashedPassword,
    createdAt: new Date().toISOString()
  };

  // Store admin in MongoDB if connected
  if (isMongoConnected && adminsCollection) {
    const existingAdmin = await adminsCollection.findOne({ email: adminCredentials.email });
    if (!existingAdmin) {
      await adminsCollection.insertOne({
        _id: new ObjectId(adminCredentials.id),
        ...adminCredentials
      });
      console.log('✅ Admin credentials saved to MongoDB');
    } else {
      adminCredentials = {
        id: existingAdmin._id.toString(),
        email: existingAdmin.email,
        phone: existingAdmin.phone,
        username: existingAdmin.username,
        password: existingAdmin.password,
        createdAt: existingAdmin.createdAt
      };
      console.log('✅ Admin credentials loaded from MongoDB');
    }
  } else {
    console.log('✅ Admin credentials initialized (in-memory)');
  }
};

const loadAdminFromDB = async () => {
  if (isMongoConnected && adminsCollection) {
    const existingAdmin = await adminsCollection.findOne({});
    if (existingAdmin) {
      adminCredentials = {
        id: existingAdmin._id.toString(),
        email: existingAdmin.email,
        phone: existingAdmin.phone,
        username: existingAdmin.username,
        password: existingAdmin.password,
        createdAt: existingAdmin.createdAt
      };
      console.log('✅ Admin credentials synced from MongoDB');
    }
  }
};

// ============================================================================
// Session Management
// ============================================================================

const generateSessionToken = () => {
  return crypto.randomBytes(64).toString('hex');
};

const createSession = async (adminData) => {
  const token = generateSessionToken();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  const session = {
    token,
    adminId: adminData.id,
    adminEmail: adminData.email,
    adminUsername: adminData.username,
    createdAt: new Date(),
    expiresAt
  };

  if (isMongoConnected && sessionsCollection) {
    await sessionsCollection.insertOne(session);
  } else {
    inMemorySessions.set(token, session);
  }

  return token;
};

const validateSession = async (token) => {
  if (!token) return null;

  let session;
  if (isMongoConnected && sessionsCollection) {
    session = await sessionsCollection.findOne({ token });
  } else {
    session = inMemorySessions.get(token);
  }

  if (!session) return null;

  if (new Date() > new Date(session.expiresAt)) {
    if (isMongoConnected && sessionsCollection) {
      await sessionsCollection.deleteOne({ token });
    } else {
      inMemorySessions.delete(token);
    }
    return null;
  }

  return session;
};

const deleteSession = async (token) => {
  if (isMongoConnected && sessionsCollection) {
    await sessionsCollection.deleteOne({ token });
  } else {
    inMemorySessions.delete(token);
  }
};

// ============================================================================
// Authentication Middleware
// ============================================================================

const authenticateSession = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  try {
    const session = await validateSession(token);
    if (!session) {
      return res.status(403).json({ error: 'Invalid or expired session' });
    }
    req.admin = {
      id: session.adminId,
      email: session.adminEmail,
      username: session.adminUsername
    };
    next();
  } catch (error) {
    res.status(403).json({ error: 'Invalid or expired session' });
  }
};

// ============================================================================
// Routes
// ============================================================================

// Health check endpoint (public)
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    mongodb: isMongoConnected ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Admin Login
app.post('/api/admin/login', async (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({ error: 'Email/phone/username and password are required' });
    }

    await loadAdminFromDB();

    if (!adminCredentials) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isAdmin = (
      adminCredentials.email === identifier ||
      adminCredentials.phone === identifier ||
      adminCredentials.username === identifier
    );

    if (!isAdmin) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(password, adminCredentials.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = await createSession(adminCredentials);

    res.json({
      success: true,
      token,
      admin: {
        id: adminCredentials.id,
        username: adminCredentials.username,
        email: adminCredentials.email
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// Admin Logout
app.post('/api/admin/logout', authenticateSession, async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    await deleteSession(token);
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Error during logout' });
  }
});

// Verify session
app.get('/api/admin/verify', authenticateSession, (req, res) => {
  res.json({
    valid: true,
    admin: {
      id: req.admin.id,
      username: req.admin.username,
      email: req.admin.email
    }
  });
});

// Submit registration form (public)
app.post('/api/applicants', async (req, res) => {
  try {
    const applicantData = req.body;

    if (!applicantData.fullName || !applicantData.email || !applicantData.mobileNumber) {
      return res.status(400).json({ error: 'Required fields are missing' });
    }

    const newApplicant = {
      ...applicantData,
      submittedAt: new Date(),
      updatedAt: new Date(),
      status: 'pending'
    };

    let savedApplicant;

    if (isMongoConnected && applicantsCollection) {
      const result = await applicantsCollection.insertOne(newApplicant);
      savedApplicant = {
        id: result.insertedId.toString(),
        ...newApplicant
      };
    } else {
      savedApplicant = {
        id: String(inMemoryApplicants.length + 1),
        ...newApplicant
      };
      inMemoryApplicants.push(savedApplicant);
    }

    console.log(`✅ New applicant registered: ${applicantData.fullName}`);

    res.status(201).json({
      success: true,
      message: 'Registration submitted successfully',
      applicantId: savedApplicant.id
    });
  } catch (error) {
    console.error('Submission error:', error);
    res.status(500).json({ error: 'Failed to submit registration' });
  }
});

// Get all applicants (protected)
app.get('/api/applicants', authenticateSession, async (req, res) => {
  try {
    const { status, search, sortBy = 'submittedAt', order = 'desc' } = req.query;

    let query = {};

    if (status && status !== 'all') {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { mobileNumber: { $regex: search, $options: 'i' } }
      ];
    }

    let applicants = [];
    let total = 0;

    if (isMongoConnected && applicantsCollection) {
      total = await applicantsCollection.countDocuments(query);
      
      const sortDirection = order === 'desc' ? -1 : 1;
      const sortField = sortBy || 'submittedAt';
      
      applicants = await applicantsCollection
        .find(query)
        .sort({ [sortField]: sortDirection })
        .toArray();
      
      applicants = applicants.map(app => ({
        id: app._id.toString(),
        ...app
      }));
    } else {
      let filteredApplicants = [...inMemoryApplicants];

      if (status && status !== 'all') {
        filteredApplicants = filteredApplicants.filter(a => a.status === status);
      }

      if (search) {
        const searchLower = search.toLowerCase();
        filteredApplicants = filteredApplicants.filter(a =>
          a.fullName?.toLowerCase().includes(searchLower) ||
          a.email?.toLowerCase().includes(searchLower) ||
          a.mobileNumber?.includes(search)
        );
      }

      total = filteredApplicants.length;

      filteredApplicants.sort((a, b) => {
        const aVal = a[sortBy] || '';
        const bVal = b[sortBy] || '';
        return order === 'desc' ? bVal.localeCompare(aVal) : aVal.localeCompare(bVal);
      });

      applicants = filteredApplicants;
    }

    res.json({
      success: true,
      total,
      applicants
    });
  } catch (error) {
    console.error('Fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch applicants' });
  }
});

// Get single applicant (protected)
app.get('/api/applicants/:id', authenticateSession, async (req, res) => {
  try {
    let applicant;

    if (isMongoConnected && applicantsCollection) {
      const result = await applicantsCollection.findOne({ 
        _id: new ObjectId(req.params.id) 
      });
      
      if (result) {
        applicant = {
          id: result._id.toString(),
          ...result
        };
      }
    } else {
      applicant = inMemoryApplicants.find(a => a.id === req.params.id);
    }

    if (!applicant) {
      return res.status(404).json({ error: 'Applicant not found' });
    }

    res.json({ success: true, applicant });
  } catch (error) {
    console.error('Fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch applicant' });
  }
});

// Update applicant status (protected)
app.patch('/api/applicants/:id', authenticateSession, async (req, res) => {
  try {
    const { status, notes } = req.body;

    if (isMongoConnected && applicantsCollection) {
      const updateData = {};
      if (status) updateData.status = status;
      if (notes !== undefined) updateData.adminNotes = notes;
      updateData.updatedAt = new Date();

      const result = await applicantsCollection.updateOne(
        { _id: new ObjectId(req.params.id) },
        { $set: updateData }
      );

      if (result.matchedCount === 0) {
        return res.status(404).json({ error: 'Applicant not found' });
      }

      const updatedApplicant = await applicantsCollection.findOne({ 
        _id: new ObjectId(req.params.id) 
      });

      res.json({
        success: true,
        applicant: {
          id: updatedApplicant._id.toString(),
          ...updatedApplicant
        }
      });
    } else {
      const applicant = inMemoryApplicants.find(a => a.id === req.params.id);

      if (!applicant) {
        return res.status(404).json({ error: 'Applicant not found' });
      }

      if (status) applicant.status = status;
      if (notes !== undefined) applicant.adminNotes = notes;
      applicant.updatedAt = new Date().toISOString();

      res.json({ success: true, applicant });
    }
  } catch (error) {
    console.error('Update error:', error);
    res.status(500).json({ error: 'Failed to update applicant' });
  }
});

// Delete applicant (protected)
app.delete('/api/applicants/:id', authenticateSession, async (req, res) => {
  try {
    if (isMongoConnected && applicantsCollection) {
      const result = await applicantsCollection.deleteOne({ 
        _id: new ObjectId(req.params.id) 
      });

      if (result.deletedCount === 0) {
        return res.status(404).json({ error: 'Applicant not found' });
      }

      res.json({ success: true, message: 'Applicant deleted successfully' });
    } else {
      const index = inMemoryApplicants.findIndex(a => a.id === req.params.id);

      if (index === -1) {
        return res.status(404).json({ error: 'Applicant not found' });
      }

      inMemoryApplicants.splice(index, 1);
      res.json({ success: true, message: 'Applicant deleted successfully' });
    }
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: 'Failed to delete applicant' });
  }
});

// Get dashboard statistics (protected)
app.get('/api/admin/stats', authenticateSession, async (req, res) => {
  try {
    let totalApplicants = 0;
    let pendingCount = 0;
    let approvedCount = 0;
    let rejectedCount = 0;
    let courseDistribution = {};
    let recentSubmissions = 0;

    if (isMongoConnected && applicantsCollection) {
      const allApplicants = await applicantsCollection.find({}).toArray();
      totalApplicants = allApplicants.length;
      pendingCount = allApplicants.filter(a => a.status === 'pending').length;
      approvedCount = allApplicants.filter(a => a.status === 'approved').length;
      rejectedCount = allApplicants.filter(a => a.status === 'rejected').length;

      allApplicants.forEach(a => {
        const course = a.desiredCourse || 'Not specified';
        courseDistribution[course] = (courseDistribution[course] || 0) + 1;
      });

      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      recentSubmissions = allApplicants.filter(a => new Date(a.submittedAt) >= weekAgo).length;
    } else {
      totalApplicants = inMemoryApplicants.length;
      pendingCount = inMemoryApplicants.filter(a => a.status === 'pending').length;
      approvedCount = inMemoryApplicants.filter(a => a.status === 'approved').length;
      rejectedCount = inMemoryApplicants.filter(a => a.status === 'rejected').length;

      inMemoryApplicants.forEach(a => {
        const course = a.desiredCourse || 'Not specified';
        courseDistribution[course] = (courseDistribution[course] || 0) + 1;
      });

      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      recentSubmissions = inMemoryApplicants.filter(a => new Date(a.submittedAt) >= weekAgo).length;
    }

    res.json({
      success: true,
      stats: {
        totalApplicants,
        pendingCount,
        approvedCount,
        rejectedCount,
        recentSubmissions,
        courseDistribution
      }
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// Update admin credentials (protected)
app.put('/api/admin/credentials', authenticateSession, async (req, res) => {
  try {
    const { email, phone, username, currentPassword, newPassword } = req.body;

    if (!adminCredentials) {
      return res.status(401).json({ error: 'Admin credentials not available' });
    }

    const validPassword = await bcrypt.compare(currentPassword, adminCredentials.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    if (email) adminCredentials.email = email;
    if (phone) adminCredentials.phone = phone;
    if (username) adminCredentials.username = username;

    if (newPassword) {
      const hashed = await bcrypt.hash(newPassword, 12);
      adminCredentials.password = hashed;
    }

    if (isMongoConnected && adminsCollection) {
      await adminsCollection.updateOne(
        { _id: new ObjectId(adminCredentials.id) },
        { $set: {
          email: adminCredentials.email,
          phone: adminCredentials.phone,
          username: adminCredentials.username,
          password: adminCredentials.password
        }}
      );
    }

    res.json({
      success: true,
      message: 'Admin credentials updated successfully',
      admin: {
        id: adminCredentials.id,
        username: adminCredentials.username,
        email: adminCredentials.email,
        phone: adminCredentials.phone
      }
    });
  } catch (error) {
    console.error('Update credentials error:', error);
    res.status(500).json({ error: 'Failed to update credentials' });
  }
});

// ============================================================================
// Error Handling Middleware
// ============================================================================

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.path,
    method: req.method,
    availableEndpoints: [
      'GET /api/health',
      'POST /api/admin/login',
      'POST /api/admin/logout',
      'GET /api/admin/verify',
      'GET /api/admin/stats',
      'PUT /api/admin/credentials',
      'POST /api/applicants',
      'GET /api/applicants',
      'GET /api/applicants/:id',
      'PATCH /api/applicants/:id',
      'DELETE /api/applicants/:id'
    ]
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'production' ? 'Something went wrong' : err.message
  });
});

// ============================================================================
// Server Initialization
// ============================================================================

const startServer = async () => {
  await initializeAdmin();
  isMongoConnected = await connectToMongoDB();
  
  if (isMongoConnected) {
    await loadAdminFromDB();
    console.log('🚀 Server running with MongoDB Atlas');
  } else {
    console.log('⚠️  Server running with in-memory storage (data will be lost on restart)');
  }

  app.listen(PORT, () => {
    console.log(`📡 Server running on port ${PORT}`);
    
    // Log endpoints using production URL if available, otherwise localhost for development
    const baseUrl = process.env.BACKEND_URL || `http://localhost:${PORT}`;
    console.log(`🔐 Admin login endpoint: ${baseUrl}/api/admin/login`);
    console.log(`📝 Applicants endpoint: ${baseUrl}/api/applicants`);
    console.log(`🏥 Health check: ${baseUrl}/api/health`);
    
    if (process.env.NODE_ENV === 'production' && process.env.BACKEND_URL) {
      console.log(`🌐 Production URL: ${process.env.BACKEND_URL}`);
    }
  });
};

startServer();