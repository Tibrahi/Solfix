# Solfix Deployment Guide - Production-Safe API Communication

This guide explains how to deploy the Solfix application with a stable, production-safe API communication layer that automatically handles environment switching between local development and production.

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Root Cause Analysis](#root-cause-analysis)
- [Prerequisites](#prerequisites)
- [Backend Deployment to Render](#backend-deployment-to-render)
- [Frontend Deployment to Vercel](#frontend-deployment-to-vercel)
- [Environment Configuration](#environment-configuration)
- [Local Development](#local-development)
- [Troubleshooting](#troubleshooting)
- [API Endpoints](#api-endpoints)

---

## Architecture Overview

### Problem Statement

The application previously had unstable API communication due to:
- Hardcoded localhost/backend URLs in frontend code
- Static CORS origin lists requiring manual updates
- No automatic environment detection
- API requests failing silently after deployment
- Domain changes breaking the communication layer

### Solution

The new architecture implements:

1. **Dynamic API URL Resolution** (`frontend/src/config.js`)
   - Automatically detects environment (development vs production)
   - Uses `VITE_API_URL` environment variable when set
   - Falls back to relative `/api` path in production (same-origin)
   - Falls back to `localhost:5000` in development

2. **Dynamic CORS Configuration** (`backend/index.js`)
   - Supports regex patterns for Vercel/Render preview URLs
   - Reads allowed origins from `ALLOWED_ORIGINS` environment variable
   - Automatically allows common deployment patterns

3. **Enhanced API Request Handler**
   - Automatic JWT token injection
   - Retry logic with exponential backoff
   - Automatic redirect to login on 401 responses
   - Comprehensive error handling

---

## Root Cause Analysis

### Issue 1: Hardcoded API URLs

**Before:**
```javascript
// Old config.js - hardcoded fallback
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://solfix.onrender.com/api';
```

**After:**
```javascript
// New config.js - dynamic resolution
const resolveApiBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl) return envUrl.replace(/\/$/, '');
  if (import.meta.env.PROD) return '/api'; // Relative path for production
  return 'http://localhost:5000/api'; // Development fallback
};
```

### Issue 2: Static CORS Origins

**Before:**
```javascript
// Old CORS - static list
origin: ['http://localhost:5173', 'https://solfix-1.onrender.com', '*']
```

**After:**
```javascript
// New CORS - dynamic with regex patterns
origin: (origin, callback) => {
  const isAllowed = allowedOrigins.some(allowed => {
    if (typeof allowed === 'string') return allowed === origin;
    if (allowed instanceof RegExp) return allowed.test(origin);
    return false;
  });
  callback(null, isAllowed);
}
```

### Issue 3: Silent Request Failures

**Before:**
```javascript
// Old apiRequest - no retry, no error recovery
const response = await fetch(endpoint, config);
```

**After:**
```javascript
// New apiRequest - retry logic, automatic auth recovery
for (let attempt = 0; attempt <= maxRetries; attempt++) {
  const response = await fetch(endpoint, config);
  if (response.status === 401) {
    localStorage.removeItem('adminToken');
    window.location.href = '/admin/login';
    break;
  }
}
```

---

## Prerequisites

1. **Render Account**: Sign up at [render.com](https://render.com)
2. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
3. **MongoDB Atlas**: Create a free cluster at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
4. **Node.js**: Install Node.js 18+ for local development

---

## Backend Deployment to Render

### Step 1: Create a Web Service

1. Go to your Render dashboard
2. Click "New +" and select "Web Service"
3. Connect your GitHub repository
4. Configure the service:
   - **Name**: `solfix-backend`
   - **Environment**: `Node`
   - **Build Command**: `cd backend && npm install`
   - **Start Command**: `cd backend && node index.js`
   - **Instance Type**: Free

### Step 2: Configure Environment Variables

In your Render service dashboard, add the following environment variables:

| Variable | Description | Example |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB Atlas connection string | `mongodb+srv://user:pass@cluster.mongodb.net/solfix` |
| `ADMIN_EMAIL` | Admin login email | `admin@solfix.com` |
| `ADMIN_PASSWORD` | Admin login password | `your_secure_password` |
| `ADMIN_USERNAME` | Admin username | `admin` |
| `ADMIN_PHONE` | Admin phone number | `+1234567890` |
| `ALLOWED_ORIGINS` | Frontend URLs (optional) | `https://solfix.vercel.app,https://solfix-1.onrender.com` |

> **Note**: `PORT` is automatically set by Render.

### Step 3: Deploy

After configuring, Render will automatically deploy your backend. Note the backend URL:
```
https://solfix-backend.onrender.com
```

Your API endpoints will be available at:
- `https://solfix-backend.onrender.com/api/health`
- `https://solfix-backend.onrender.com/api/admin/login`
- `https://solfix-backend.onrender.com/api/applicants`
- etc.

---

## Frontend Deployment to Vercel

### Step 1: Connect Repository

1. Go to your Vercel dashboard
2. Click "Add New..." → "Project"
3. Import your GitHub repository
4. Configure the project:
   - **Framework Preset**: Vite
   - **Root Directory**: `./frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

### Step 2: Configure Environment Variables

In your Vercel project settings, add:

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API base URL | `https://solfix-backend.onrender.com/api` |

> **Important**: This variable is baked into the build at deploy time. Changing it requires a redeploy.

### Step 3: Deploy

Click "Deploy". Vercel will build and deploy your frontend. Note the frontend URL:
```
https://solfix.vercel.app
```

### Step 4: Update Backend CORS (Important!)

After the frontend is deployed, update the backend's `ALLOWED_ORIGINS` environment variable on Render to include the new Vercel URL:

```
https://solfix.vercel.app
```

---

## Environment Configuration

### Frontend Environment Variables

Create `.env.local` in the `frontend` directory for local development:

```env
# Local development - points to localhost backend
VITE_API_URL=http://localhost:5000/api
```

### Backend Environment Variables

Create `.env` in the `backend` directory:

```env
PORT=5000
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/solfix
ADMIN_EMAIL=admin@solfix.com
ADMIN_PASSWORD=your_secure_password
ADMIN_USERNAME=admin
ADMIN_PHONE=+1234567890
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

---

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
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

2. Install dependencies and start:
```bash
cd backend
npm install
npm start
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

---

## Troubleshooting

### CORS Errors

If you see CORS errors in the browser console:

1. **Check backend ALLOWED_ORIGINS**:
   - Ensure your frontend URL is included
   - For Vercel preview deployments, use regex pattern or add specific URLs

2. **Verify backend is running**:
   ```bash
   curl https://solfix-backend.onrender.com/api/health
   ```

3. **Check browser console** for the blocked origin, then add it to `ALLOWED_ORIGINS`

### API Requests Failing

1. **Check API URL configuration**:
   - Open browser console and look for `[API Config]` messages
   - Verify `VITE_API_URL` is set correctly in Vercel

2. **Test health endpoint**:
   ```bash
   curl -v https://solfix-backend.onrender.com/api/health
   ```

3. **Check network tab** in browser DevTools for failed requests

### 401 Unauthorized Errors

1. **Token expired**: The session token expires after 24 hours
   - User needs to log in again
   - The system automatically redirects to login page

2. **Token not being sent**: Check that `Authorization` header is included
   - Open DevTools → Network tab
   - Check request headers for `Authorization: Bearer <token>`

### Admin Login Not Working

1. **Verify credentials**:
   - Check `ADMIN_EMAIL`, `ADMIN_PASSWORD` in Render environment variables
   - Default credentials: `admin@solfix.com` / `admin123` (if not set)

2. **Check MongoDB connection**:
   - Verify `MONGODB_URI` is correct
   - Ensure IP whitelist includes `0.0.0.0/0` for Render

---

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

---

## Production URLs

After deployment:

- **Backend API**: `https://solfix-backend.onrender.com/api`
- **Frontend**: `https://solfix.vercel.app`

---

## Deployment Checklist

### Backend (Render)
- [ ] MongoDB URI configured
- [ ] Admin credentials set (non-default password)
- [ ] ALLOWED_ORIGINS includes frontend URL
- [ ] Health endpoint returns 200

### Frontend (Vercel)
- [ ] VITE_API_URL set to backend URL
- [ ] Build completes successfully
- [ ] API requests reach backend
- [ ] Admin login works

### Post-Deployment
- [ ] Test admin login
- [ ] Test applicant registration
- [ ] Test dashboard functionality
- [ ] Verify CORS allows all needed origins

---

## Support

For issues or questions:
1. Check the Render logs in the dashboard
2. Check Vercel function logs if using serverless
3. Review browser console for client-side errors
4. Verify environment variables are correctly set