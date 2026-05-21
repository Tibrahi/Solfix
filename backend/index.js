import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { ObjectId } from 'mongodb';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import {
  connectToMongoDB,
  initializeAdmin,
  loadAdminFromDB,
  createSession,
  validateSession,
  deleteSession,
  getAdminCredentials,
  getIsMongoConnected,
  getApplicantsCollection,
  getAdminsCollection,
  getSessionsCollection,
  getInMemoryApplicants
} from './api/lib/db.js';

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
  const origins = [
    // Local development
    'http://localhost:5173',
    'http://localhost:3000',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:3000',
  ];

  // Add origins from environment variable (comma-separated)
  if (process.env.ALLOWED_ORIGINS) {
    const envOrigins = process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim());
    origins.push(...envOrigins);
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

// Get references from db.js module
const inMemoryApplicants = getInMemoryApplicants();

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
    console.error('[Auth] Session validation error:', error.message);
    res.status(403).json({ error: 'Invalid or expired session' });
  }
};

// ============================================================================
// Routes
// ============================================================================

// Root health check endpoint (for Render uptime monitoring)
app.get('/', (req, res) => {
  const isMongoConnected = getIsMongoConnected();
  res.json({
    status: 'ok',
    service: 'solfix-backend',
    mongodb: isMongoConnected ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      login: '/api/admin/login',
      applicants: '/api/applicants'
    }
  });
});

// Health check endpoint (public)
app.get('/api/health', (req, res) => {
  const isMongoConnected = getIsMongoConnected();
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
    await connectToMongoDB();
    await initializeAdmin();
    
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({ error: 'Email/phone/username and password are required' });
    }

    // Get current admin credentials (already initialized)
    let adminCredentials = getAdminCredentials();
    
    // If no credentials in memory, try to load from DB
    if (!adminCredentials) {
      await loadAdminFromDB();
      adminCredentials = getAdminCredentials();
    }
    
    if (!adminCredentials) {
      console.error('❌ No admin credentials available');
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check if identifier matches email, phone, or username (case-insensitive for email/username)
    const identifierLower = identifier.toLowerCase();
    const isAdmin = (
      adminCredentials.email?.toLowerCase() === identifierLower ||
      adminCredentials.phone === identifier ||
      adminCredentials.username?.toLowerCase() === identifierLower
    );

    if (!isAdmin) {
      console.log(`❌ Login attempt with unknown identifier: ${identifier}`);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(password, adminCredentials.password);
    if (!validPassword) {
      console.log(`❌ Invalid password for admin: ${adminCredentials.username}`);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = await createSession(adminCredentials);
    
    console.log(`✅ Admin login successful: ${adminCredentials.username}`);

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
app.post('/api/admin/logout', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const session = await validateSession(token);
    if (!session) {
      return res.status(401).json({ error: 'Invalid or expired session' });
    }
    
    await deleteSession(token);
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Error during logout' });
  }
});

// Verify session
app.get('/api/admin/verify', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ valid: false, error: 'No token provided' });
    }
    
    const session = await validateSession(token);
    if (!session) {
      return res.status(401).json({ valid: false, error: 'Invalid or expired session' });
    }
    
    res.json({
      valid: true,
      admin: {
        id: session.adminId,
        username: session.adminUsername,
        email: session.adminEmail
      }
    });
  } catch (error) {
    res.status(500).json({ valid: false, error: 'Server error during verification' });
  }
});

// Submit registration form (public)
app.post('/api/applicants', async (req, res) => {
  try {
    await connectToMongoDB();
    
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
    const isMongoConnected = getIsMongoConnected();
    const applicantsCollection = getApplicantsCollection();

    if (isMongoConnected && applicantsCollection) {
      const result = await applicantsCollection.insertOne(newApplicant);
      savedApplicant = {
        id: result.insertedId.toString(),
        ...newApplicant
      };
    } else {
      const inMemoryApplicants = getInMemoryApplicants();
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
app.get('/api/applicants', async (req, res) => {
  try {
    // Verify authentication
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }
    
    const session = await validateSession(token);
    if (!session) {
      return res.status(403).json({ error: 'Invalid or expired session' });
    }

    await connectToMongoDB();
    
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
    const isMongoConnected = getIsMongoConnected();
    const applicantsCollection = getApplicantsCollection();

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
      const inMemoryApplicants = getInMemoryApplicants();
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
app.get('/api/applicants/:id', async (req, res) => {
  try {
    // Verify authentication
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }
    
    const session = await validateSession(token);
    if (!session) {
      return res.status(403).json({ error: 'Invalid or expired session' });
    }

    await connectToMongoDB();
    
    let applicant;
    const isMongoConnected = getIsMongoConnected();
    const applicantsCollection = getApplicantsCollection();

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
      const inMemoryApplicants = getInMemoryApplicants();
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
app.patch('/api/applicants/:id', async (req, res) => {
  try {
    // Verify authentication
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }
    
    const session = await validateSession(token);
    if (!session) {
      return res.status(403).json({ error: 'Invalid or expired session' });
    }

    await connectToMongoDB();
    
    const { status, notes } = req.body;
    const isMongoConnected = getIsMongoConnected();
    const applicantsCollection = getApplicantsCollection();

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
      const inMemoryApplicants = getInMemoryApplicants();
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
app.delete('/api/applicants/:id', async (req, res) => {
  try {
    // Verify authentication
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }
    
    const session = await validateSession(token);
    if (!session) {
      return res.status(403).json({ error: 'Invalid or expired session' });
    }

    await connectToMongoDB();
    
    const isMongoConnected = getIsMongoConnected();
    const applicantsCollection = getApplicantsCollection();

    if (isMongoConnected && applicantsCollection) {
      const result = await applicantsCollection.deleteOne({ 
        _id: new ObjectId(req.params.id) 
      });

      if (result.deletedCount === 0) {
        return res.status(404).json({ error: 'Applicant not found' });
      }

      res.json({ success: true, message: 'Applicant deleted successfully' });
    } else {
      const inMemoryApplicants = getInMemoryApplicants();
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
app.get('/api/admin/stats', async (req, res) => {
  try {
    // Verify authentication
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }
    
    const session = await validateSession(token);
    if (!session) {
      return res.status(403).json({ error: 'Invalid or expired session' });
    }

    await connectToMongoDB();
    
    let totalApplicants = 0;
    let pendingCount = 0;
    let approvedCount = 0;
    let rejectedCount = 0;
    let courseDistribution = {};
    let recentSubmissions = 0;
    const isMongoConnected = getIsMongoConnected();
    const applicantsCollection = getApplicantsCollection();

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
      const inMemoryApplicants = getInMemoryApplicants();
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
app.put('/api/admin/credentials', async (req, res) => {
  try {
    // Verify authentication
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }
    
    const session = await validateSession(token);
    if (!session) {
      return res.status(403).json({ error: 'Invalid or expired session' });
    }

    await connectToMongoDB();
    await initializeAdmin();
    
    const { email, phone, username, currentPassword, newPassword } = req.body;

    const adminCredentials = getAdminCredentials();
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

    const isMongoConnected = getIsMongoConnected();
    const adminsCollection = getAdminsCollection();

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
  const isMongoConnected = await connectToMongoDB();
  
  if (isMongoConnected) {
    await initializeAdmin();
    await loadAdminFromDB();
    console.log('🚀 Server running with MongoDB Atlas');
  } else {
    await initializeAdmin();
    console.log('⚠️  Server running with in-memory storage (data will be lost on restart)');
  }

  app.listen(PORT, () => {
    console.log(`📡 Server running on port ${PORT}`);
    console.log(`🔐 Admin login endpoint: http://localhost:${PORT}/api/admin/login`);
    console.log(`📝 Applicants endpoint: http://localhost:${PORT}/api/applicants`);
    console.log(`🏥 Health check: http://localhost:${PORT}/api/health`);
    
    if (process.env.BACKEND_URL) {
      console.log(`🌐 Public URL: ${process.env.BACKEND_URL}`);
    }
  });
};

startServer();
