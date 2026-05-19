import { connectToMongoDB, authenticateSession, getIsMongoConnected, getApplicantsCollection, getInMemoryApplicants } from '../../lib/db.js';
import { ObjectId } from 'mongodb';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST,PATCH,DELETE,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  await connectToMongoDB();

  // POST - Submit registration form (public - no auth required)
  if (req.method === 'POST') {
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
      const isMongoConnected = getIsMongoConnected();

      if (isMongoConnected) {
        const applicantsCollection = getApplicantsCollection();
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

      return res.status(201).json({
        success: true,
        message: 'Registration submitted successfully',
        applicantId: savedApplicant.id
      });
    } catch (error) {
      console.error('Submission error:', error);
      return res.status(500).json({ error: 'Failed to submit registration' });
    }
  }

  // GET - Get all applicants (protected)
  if (req.method === 'GET') {
    try {
      const authHeader = req.headers['authorization'];
      const token = authHeader && authHeader.split(' ')[1];

      if (!token) {
        return res.status(401).json({ error: 'Access denied. No token provided.' });
      }

      const admin = await authenticateSession(token);
      if (!admin) {
        return res.status(403).json({ error: 'Invalid or expired session' });
      }

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

      if (isMongoConnected) {
        const applicantsCollection = getApplicantsCollection();
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

      return res.status(200).json({
        success: true,
        total,
        applicants
      });
    } catch (error) {
      console.error('Fetch error:', error);
      return res.status(500).json({ error: 'Failed to fetch applicants' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}