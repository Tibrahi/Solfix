# Complete Production Deployment Guide

## Overview

This guide explains how to deploy Solfix to Render.com with proper production configuration. The system uses:

- **Frontend (Static Site):** `https://solfix-1.onrender.com`
- **Backend (Web Service):** `https://solfix.onrender.com`
- **Database:** MongoDB Atlas

## Key Changes for Production

✅ **No localhost references** - All URLs use production domain names  
✅ **No hardcoded ports** - System uses domain names instead of ports  
✅ **CORS properly configured** - Backend accepts requests from production frontend  
✅ **Environment-driven** - All configuration via environment variables  

## Prerequisites

1. MongoDB Atlas cluster set up
2. Render.com account
3. Git repository connected to Render

## Step 1: Deploy Backend to Render.com

### Create Web Service

1. Go to Render.com dashboard
2. Click "New +" → "Web Service"
3. Connect your Git repository
4. Configure:
   - **Name:** `solfix-backend`
   - **Region:** Choose closest to your users
   - **Branch:** `main` (or your deployment branch)
   - **Root Directory:** `backend`
   - **Runtime:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `node index.js`
   - **Instance Type:** Free (or paid for production)

### Set Environment Variables

In Render dashboard, add these environment variables:

```
MONGODB_URI=mongodb+srv://Crackers:IVF0VLL9TzzWSwVW@cluster0.upola4k.mongodb.net/?appName=Cluster0&retryWrites=true&w=majority&ssl=true&tls=true&tlsAllowInvalidCertificates=true
ADMIN_EMAIL=admin@solfix.com
ADMIN_PASSWORD=Solfix@123
ADMIN_USERNAME=admin
ADMIN_PHONE=+1234567890
ALLOWED_ORIGINS=https://solfix-1.onrender.com,https://solfix.onrender.com
BACKEND_URL=https://solfix.onrender.com
NODE_ENV=production
```

**Important:** 
- Do NOT set PORT - Render manages this automatically
- Change ADMIN_PASSWORD from the default!
- Ensure ALLOWED_ORIGINS includes your frontend URL

### Deploy

1. Click "Create Web Service"
2. Wait for deployment to complete
3. Note your backend URL (e.g., `https://solfix.onrender.com`)

### Verify Backend

Test the health endpoint:
```bash
curl https://solfix.onrender.com/api/health
```

Expected response:
```json
{
  "status": "ok",
  "mongodb": "connected",
  "timestamp": "2026-05-20T...",
  "version": "1.0.0"
}
```

## Step 2: Deploy Frontend to Render.com

### Create Static Site

1. Go to Render.com dashboard
2. Click "New +" → "Static Site"
3. Connect your Git repository
4. Configure:
   - **Name:** `solfix-frontend`
   - **Region:** Same as backend
   - **Branch:** `main` (or your deployment branch)
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build`
   - **Publish Directory:** `dist`

### Set Environment Variables

In Render dashboard, add this environment variable:

```
VITE_API_URL=https://solfix.onrender.com/api
```

**Important:**
- This tells the frontend where to send API requests
- Must match your backend URL exactly
- Do NOT use localhost!

### Deploy

1. Click "Create Static Site"
2. Wait for deployment to complete
3. Note your frontend URL (e.g., `https://solfix-1.onrender.com`)

## Step 3: Test the Complete System

### 1. Access Frontend
```
https://solfix-1.onrender.com
```

### 2. Test Admin Login
1. Go to: `https://solfix-1.onrender.com/admin/login`
2. Login with:
   - Email/Username: `admin`
   - Password: `Solfix@123` (or your custom password)
3. Should redirect to dashboard

### 3. Test Registration
1. Go to: `https://solfix-1.onrender.com/register`
2. Fill out and submit the form
3. Should show success message

### 4. Verify API Communication

Open browser console (F12) and check:
- No CORS errors
- API calls go to `https://solfix.onrender.com/api/*`
- No localhost references

## Step 4: Custom Domain (Optional)

If you have a custom domain:

### Backend
1. In Render dashboard, go to backend service
2. Add custom domain (e.g., `api.solfix.com`)
3. Update DNS records
4. Update environment variables:
   ```
   BACKEND_URL=https://api.solfix.com
   ALLOWED_ORIGINS=https://solfix.com,https://api.solfix.com
   ```

### Frontend
1. In Render dashboard, go to static site
2. Add custom domain (e.g., `solfix.com`)
3. Update DNS records
4. Update environment variable:
   ```
   VITE_API_URL=https://api.solfix.com/api
   ```

## Troubleshooting

### Admin Login Not Working

**Symptom:** Login fails or shows "Invalid credentials"

**Solutions:**
1. Check browser console for errors
2. Verify backend is running: `curl https://solfix.onrender.com/api/health`
3. Check CORS headers in network tab
4. Verify admin credentials in Render dashboard
5. Check MongoDB connection

### CORS Errors

**Symptom:** "Access to fetch has been blocked by CORS policy"

**Solutions:**
1. Verify `ALLOWED_ORIGINS` includes your frontend URL
2. Check for trailing slashes in URLs
3. Ensure frontend URL matches exactly (http vs https)
4. Clear browser cache

### API Calls Going to localhost

**Symptom:** Network requests show `localhost:5000`

**Solutions:**
1. Rebuild frontend after setting `VITE_API_URL`
2. Clear browser cache
3. Check frontend build output
4. Verify environment variable is set in Render dashboard

### MongoDB Connection Issues

**Symptom:** Health check shows "disconnected"

**Solutions:**
1. Verify MongoDB URI is correct
2. Check MongoDB Atlas network access (allow all IPs: 0.0.0.0/0)
3. Verify database user has correct permissions
4. Check MongoDB connection string format

## Security Best Practices

1. **Change Default Password:**
   ```bash
   # After deployment, change admin password via API or MongoDB
   ```

2. **Use Strong Passwords:**
   - Minimum 12 characters
   - Include uppercase, lowercase, numbers, symbols

3. **Enable MongoDB IP Whitelist:**
   - In MongoDB Atlas, restrict access to Render's IP ranges
   - Or use VPC peering for better security

4. **Use HTTPS Only:**
   - All URLs must use https://
   - Never use http:// in production

5. **Monitor Logs:**
   - Check Render logs regularly
   - Monitor for suspicious activity

## Maintenance

### Update Environment Variables

1. Go to Render dashboard
2. Update environment variable
3. Service will automatically redeploy

### Update Application

1. Push changes to Git
2. Render automatically deploys
3. Monitor deployment logs

### Backup Database

1. Set up MongoDB Atlas backups
2. Regular automated snapshots
3. Test restore procedures

## Support

If you encounter issues:

1. Check Render logs in dashboard
2. Review browser console errors
3. Test API endpoints directly with curl
4. Verify environment variables are set correctly
5. Check MongoDB Atlas connection

## Verification Checklist

- [ ] Backend deployed and healthy
- [ ] Frontend deployed and accessible
- [ ] Admin login works
- [ ] Registration form submits successfully
- [ ] No CORS errors in console
- [ ] API calls use production URLs
- [ ] MongoDB connected
- [ ] Environment variables set correctly
- [ ] No localhost references in production
- [ ] HTTPS enabled for all endpoints

## Success Indicators

✅ Frontend loads at `https://solfix-1.onrender.com`  
✅ Admin login works without errors  
✅ Registration submits to backend  
✅ All API calls use `https://solfix.onrender.com/api`  
✅ No localhost references in browser console  
✅ MongoDB shows "connected" in health check  
✅ CORS headers properly set  
✅ HTTPS enforced everywhere  

## Next Steps

1. Set up monitoring and alerts
2. Configure custom domain (if needed)
3. Set up SSL certificates
4. Implement rate limiting
5. Add analytics tracking
6. Set up error logging service
7. Configure automated backups
8. Plan for scaling