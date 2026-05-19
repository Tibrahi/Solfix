# Solfix Deployment Guide

This guide explains how to deploy the Solfix application (frontend + backend) to Vercel.

## Project Structure

```
Solfix/
├── backend/           # Express.js backend API
│   ├── api/          # Vercel serverless functions
│   │   ├── admin/    # Admin endpoints
│   │   ├── applicants/ # Applicant endpoints
│   │   ├── lib/      # Shared database utilities
│   │   └── health.js # Health check endpoint
│   ├── index.js      # Local development server
│   ├── vercel.json   # Vercel configuration
│   └── package.json
├── frontend/         # React/Vite frontend
│   ├── src/
│   │   └── config.js # API configuration
│   └── package.json
└── DEPLOYMENT.md
```

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **MongoDB Atlas**: Create a free cluster at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
3. **Node.js**: Install Node.js 18+ for local development

## Backend Deployment to Vercel

### Step 1: Configure Environment Variables

In your Vercel project dashboard, add the following environment variables:

| Variable | Description | Example |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB Atlas connection string | `mongodb+srv://user:pass@cluster.mongodb.net/solfix` |
| `ADMIN_EMAIL` | Admin login email | `admin@solfix.com` |
| `ADMIN_PASSWORD` | Admin login password | `your_secure_password` |
| `ADMIN_USERNAME` | Admin username | `admin` |
| `ADMIN_PHONE` | Admin phone number | `+1234567890` |

### Step 2: Deploy Backend

```bash
cd backend
vercel --prod
```

### Step 3: Note Your Backend URL

After deployment, Vercel will provide a URL like:
`https://solfix-backend.vercel.app`

Your API endpoints will be available at:
- `https://solfix-backend.vercel.app/api/health`
- `https://solfix-backend.vercel.app/api/admin/login`
- `https://solfix-backend.vercel.app/api/applicants`
- etc.

## Frontend Deployment to Vercel

### Step 1: Configure Environment Variables

In your Vercel frontend project dashboard, add:

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API base URL | `https://solfix-backend.vercel.app/api` |

### Step 2: Deploy Frontend

```bash
cd frontend
vercel --prod
```

## Local Development

### Backend (Local)

1. Create a `.env` file in the `backend` directory:
```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
ADMIN_EMAIL=admin@solfix.com
ADMIN_PASSWORD=your_password
ADMIN_USERNAME=admin
ADMIN_PHONE=+1234567890
```

2. Install dependencies and start:
```bash
cd backend
npm install
npm run dev
```

The server will start at `http://localhost:5000`

### Frontend (Local)

1. Create a `.env.local` file in the `frontend` directory:
```env
VITE_API_URL=http://localhost:5000/api
```

2. Install dependencies and start:
```bash
cd frontend
npm install
npm run dev
```

The frontend will start at `http://localhost:5173`

## Testing the Deployment

### Health Check
```bash
curl https://your-backend.vercel.app/api/health
```

Expected response:
```json
{
  "status": "ok",
  "mongodb": "connected",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Admin Login
```bash
curl -X POST https://your-backend.vercel.app/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"identifier":"admin@solfix.com","password":"your_password"}'
```

## Default Admin Credentials

If you don't set environment variables, the backend will use these defaults:
- **Email**: `admin@solfix.com`
- **Password**: `admin123`
- **Username**: `admin`
- **Phone**: `+1234567890`

⚠️ **Important**: Change these defaults in production!

## Troubleshooting

### 404 Errors on Routes

If you're getting 404 errors, check:
1. The `vercel.json` configuration is correct
2. All API files are in the `api/` directory
3. The routes in `vercel.json` match your endpoint paths

### bcryptjs Error

If you see `Error: Illegal arguments: undefined, number`:
1. Make sure `ADMIN_PASSWORD` environment variable is set
2. Or the backend will use the default password `admin123`

### CORS Errors

The backend is configured to allow all origins (`*`) for development.
For production, update the CORS configuration in each API function:
```javascript
res.setHeader('Access-Control-Allow-Origin', 'https://your-frontend.vercel.app');
```

### MongoDB Connection Issues

1. Verify your MongoDB Atlas connection string is correct
2. Ensure your IP address is whitelisted in MongoDB Atlas
3. Check that the database user has proper permissions

## API Endpoints

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| GET | `/api/health` | No | Health check |
| POST | `/api/admin/login` | No | Admin login |
| POST | `/api/admin/logout` | Yes | Admin logout |
| GET | `/api/admin/verify` | Yes | Verify session |
| GET | `/api/admin/stats` | Yes | Dashboard statistics |
| PUT | `/api/admin/credentials` | Yes | Update admin credentials |
| POST | `/api/applicants` | No | Submit registration |
| GET | `/api/applicants` | Yes | Get all applicants |
| GET | `/api/applicants/:id` | Yes | Get single applicant |
| PATCH | `/api/applicants/:id` | Yes | Update applicant |
| DELETE | `/api/applicants/:id` | Yes | Delete applicant |

## Support

For issues or questions:
1. Check the Vercel function logs in the dashboard
2. Review the backend logs for errors
3. Verify environment variables are correctly set