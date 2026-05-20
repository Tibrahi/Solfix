import { MongoClient, ObjectId } from 'mongodb';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

// MongoDB Connection
let mongoClient = null;
let db = null;
let applicantsCollection = null;
let adminsCollection = null;
let sessionsCollection = null;

// In-memory fallback storage
const inMemoryApplicants = [];
const inMemorySessions = new Map();
let adminCredentials = null;
let isMongoConnected = false;
let adminInitialized = false;

export const getMongoClient = () => mongoClient;
export const getDb = () => db;
export const getApplicantsCollection = () => applicantsCollection;
export const getAdminsCollection = () => adminsCollection;
export const getSessionsCollection = () => sessionsCollection;
export const getIsMongoConnected = () => isMongoConnected;
export const getAdminCredentials = () => adminCredentials;
export const getInMemoryApplicants = () => inMemoryApplicants;
export const getInMemorySessions = () => inMemorySessions;

export const connectToMongoDB = async () => {
  if (isMongoConnected) return true;
  
  try {
    const mongoUri = process.env.MONGODB_URI;
    
    if (!mongoUri || mongoUri.includes('<username>') || mongoUri.includes('<password>')) {
      console.warn('⚠️  MongoDB URI not configured.');
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
    
    isMongoConnected = true;
    return true;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    return false;
  }
};

export const initializeAdmin = async () => {
  if (adminInitialized) return;
  
  const adminPassword = process.env.ADMIN_PASSWORD || 'Solfix@123';
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@solfix.com';
  const adminPhone = process.env.ADMIN_PHONE || '+1234567890';
  const adminUsername = process.env.ADMIN_USERNAME || 'admin';

  if (!process.env.ADMIN_PASSWORD) {
    console.warn('⚠️  ADMIN_PASSWORD not set. Using default password "Solfix@123". Please set ADMIN_PASSWORD in environment variables for production.');
  }

  const hashedPassword = await bcrypt.hash(adminPassword, 12);
  
  // Store admin in MongoDB if connected
  if (isMongoConnected && adminsCollection) {
    try {
      const existingAdmin = await adminsCollection.findOne({ 
        $or: [
          { email: adminEmail },
          { username: adminUsername }
        ]
      });
      
      if (!existingAdmin) {
        // Create new admin with a proper ObjectId
        const newId = new ObjectId();
        adminCredentials = {
          id: newId.toString(),
          email: adminEmail,
          phone: adminPhone,
          username: adminUsername,
          password: hashedPassword,
          createdAt: new Date().toISOString()
        };
        
        await adminsCollection.insertOne({
          _id: newId,
          email: adminCredentials.email,
          phone: adminCredentials.phone,
          username: adminCredentials.username,
          password: adminCredentials.password,
          createdAt: adminCredentials.createdAt
        });
        console.log('✅ Admin credentials created in MongoDB');
      } else {
        // Load existing admin from MongoDB
        adminCredentials = {
          id: existingAdmin._id.toString(),
          email: existingAdmin.email,
          phone: existingAdmin.phone || adminPhone,
          username: existingAdmin.username,
          password: existingAdmin.password,
          createdAt: existingAdmin.createdAt
        };
        console.log('✅ Admin credentials loaded from MongoDB');
        
        // Update MongoDB with any missing fields from .env (except password)
        const updateData = {};
        if (!existingAdmin.phone && adminPhone) updateData.phone = adminPhone;
        if (Object.keys(updateData).length > 0) {
          await adminsCollection.updateOne(
            { _id: existingAdmin._id },
            { $set: updateData }
          );
        }
      }
    } catch (error) {
      console.error('❌ Error initializing admin in MongoDB:', error.message);
      console.log('⚠️  Using in-memory admin credentials');
      // Fallback to in-memory
      adminCredentials = {
        id: 'admin-001',
        email: adminEmail,
        phone: adminPhone,
        username: adminUsername,
        password: hashedPassword,
        createdAt: new Date().toISOString()
      };
    }
  } else {
    // In-memory mode
    adminCredentials = {
      id: 'admin-001',
      email: adminEmail,
      phone: adminPhone,
      username: adminUsername,
      password: hashedPassword,
      createdAt: new Date().toISOString()
    };
    console.log('✅ Admin credentials initialized (in-memory mode - MongoDB not connected)');
  }
  
  adminInitialized = true;
};

export const loadAdminFromDB = async () => {
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
    }
  }
};

export const generateSessionToken = () => {
  return crypto.randomBytes(64).toString('hex');
};

export const createSession = async (adminData) => {
  const token = generateSessionToken();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

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

export const validateSession = async (token) => {
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

export const deleteSession = async (token) => {
  if (isMongoConnected && sessionsCollection) {
    await sessionsCollection.deleteOne({ token });
  } else {
    inMemorySessions.delete(token);
  }
};

export const authenticateSession = async (token) => {
  if (!token) return null;

  try {
    const session = await validateSession(token);
    if (!session) return null;
    
    return {
      id: session.adminId,
      email: session.adminEmail,
      username: session.adminUsername
    };
  } catch (error) {
    return null;
  }
};