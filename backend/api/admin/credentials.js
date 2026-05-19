import { connectToMongoDB, authenticateSession, getAdminCredentials, getIsMongoConnected, getAdminsCollection } from '../../lib/db.js';
import bcrypt from 'bcryptjs';
import { ObjectId } from 'mongodb';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST,PATCH,DELETE,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await connectToMongoDB();

    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    const admin = await authenticateSession(token);
    if (!admin) {
      return res.status(403).json({ error: 'Invalid or expired session' });
    }

    const { email, phone, username, currentPassword, newPassword } = req.body;

    const adminCredentials = getAdminCredentials();
    if (!adminCredentials) {
      return res.status(401).json({ error: 'Admin credentials not available' });
    }

    const validPassword = await bcrypt.compare(currentPassword, adminCredentials.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Update credentials
    if (email) adminCredentials.email = email;
    if (phone) adminCredentials.phone = phone;
    if (username) adminCredentials.username = username;

    if (newPassword) {
      const hashed = await bcrypt.hash(newPassword, 12);
      adminCredentials.password = hashed;
    }

    // Persist to MongoDB
    const isMongoConnected = getIsMongoConnected();
    if (isMongoConnected) {
      const adminsCollection = getAdminsCollection();
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

    return res.status(200).json({
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
    return res.status(500).json({ error: 'Failed to update credentials' });
  }
}