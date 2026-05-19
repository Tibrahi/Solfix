import { connectToMongoDB, authenticateSession, getIsMongoConnected, getApplicantsCollection, getInMemoryApplicants } from '../../lib/db.js';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST,PATCH,DELETE,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
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

    let totalApplicants = 0;
    let pendingCount = 0;
    let approvedCount = 0;
    let rejectedCount = 0;
    let courseDistribution = {};
    let recentSubmissions = 0;

    const isMongoConnected = getIsMongoConnected();
    
    if (isMongoConnected) {
      const applicantsCollection = getApplicantsCollection();
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

    return res.status(200).json({
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
    return res.status(500).json({ error: 'Failed to fetch statistics' });
  }
}