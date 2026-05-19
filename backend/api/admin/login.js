import { connectToMongoDB, initializeAdmin, loadAdminFromDB, createSession, getAdminCredentials, getIsMongoConnected, getInMemoryApplicants } from '../../lib/db.js';
import bcrypt from 'bcryptjs';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST,PATCH,DELETE,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await connectToMongoDB();
    await initializeAdmin();
    
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({ error: 'Email/phone/username and password are required' });
    }

    await loadAdminFromDB();

    const adminCredentials = getAdminCredentials();
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

    return res.status(200).json({
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
    return res.status(500).json({ error: 'Server error during login' });
  }
}