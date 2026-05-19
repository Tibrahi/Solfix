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

  // Check authentication
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  const admin = await authenticateSession(token);
  if (!admin) {
    return res.status(403).json({ error: 'Invalid or expired session' });
  }

  const { id } = req.query;

  // GET - Get single applicant
  if (req.method === 'GET') {
    try {
      let applicant;
      const isMongoConnected = getIsMongoConnected();

      if (isMongoConnected) {
        const applicantsCollection = getApplicantsCollection();
        const result = await applicantsCollection.findOne({ 
          _id: new ObjectId(id) 
        });
        
        if (result) {
          applicant = {
            id: result._id.toString(),
            ...result
          };
        }
      } else {
        const inMemoryApplicants = getInMemoryApplicants();
        applicant = inMemoryApplicants.find(a => a.id === id);
      }

      if (!applicant) {
        return res.status(404).json({ error: 'Applicant not found' });
      }

      return res.status(200).json({ success: true, applicant });
    } catch (error) {
      console.error('Fetch error:', error);
      return res.status(500).json({ error: 'Failed to fetch applicant' });
    }
  }

  // PATCH - Update applicant status
  if (req.method === 'PATCH') {
    try {
      const { status, notes } = req.body;
      const isMongoConnected = getIsMongoConnected();

      if (isMongoConnected) {
        const applicantsCollection = getApplicantsCollection();
        const updateData = {};
        if (status) updateData.status = status;
        if (notes !== undefined) updateData.adminNotes = notes;
        updateData.updatedAt = new Date();

        const result = await applicantsCollection.updateOne(
          { _id: new ObjectId(id) },
          { $set: updateData }
        );

        if (result.matchedCount === 0) {
          return res.status(404).json({ error: 'Applicant not found' });
        }

        const updatedApplicant = await applicantsCollection.findOne({ 
          _id: new ObjectId(id) 
        });

        return res.status(200).json({
          success: true,
          applicant: {
            id: updatedApplicant._id.toString(),
            ...updatedApplicant
          }
        });
      } else {
        const inMemoryApplicants = getInMemoryApplicants();
        const applicant = inMemoryApplicants.find(a => a.id === id);

        if (!applicant) {
          return res.status(404).json({ error: 'Applicant not found' });
        }

        if (status) applicant.status = status;
        if (notes !== undefined) applicant.adminNotes = notes;
        applicant.updatedAt = new Date().toISOString();

        return res.status(200).json({ success: true, applicant });
      }
    } catch (error) {
      console.error('Update error:', error);
      return res.status(500).json({ error: 'Failed to update applicant' });
    }
  }

  // DELETE - Delete applicant
  if (req.method === 'DELETE') {
    try {
      const isMongoConnected = getIsMongoConnected();

      if (isMongoConnected) {
        const applicantsCollection = getApplicantsCollection();
        const result = await applicantsCollection.deleteOne({ 
          _id: new ObjectId(id) 
        });

        if (result.deletedCount === 0) {
          return res.status(404).json({ error: 'Applicant not found' });
        }

        return res.status(200).json({ success: true, message: 'Applicant deleted successfully' });
      } else {
        const inMemoryApplicants = getInMemoryApplicants();
        const index = inMemoryApplicants.findIndex(a => a.id === id);

        if (index === -1) {
          return res.status(404).json({ error: 'Applicant not found' });
        }

        inMemoryApplicants.splice(index, 1);
        return res.status(200).json({ success: true, message: 'Applicant deleted successfully' });
      }
    } catch (error) {
      console.error('Delete error:', error);
      return res.status(500).json({ error: 'Failed to delete applicant' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}