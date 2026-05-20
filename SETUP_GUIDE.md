# Solfix Admin System - Complete Setup & Deployment Guide

## 🚀 Overview

This is a full-stack admin management system built with React (frontend) and Node.js/Express (backend), featuring MongoDB Atlas integration for data persistence.

## 📋 Prerequisites

- **Node.js** v18+ and npm
- **MongoDB Atlas** account (free tier works)
- **Git** for version control

## 🛠️ Local Development Setup

### 1. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env  # Or edit .env directly

# Edit .env with your MongoDB connection string and admin credentials
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/solfix
# ADMIN_EMAIL=admin@solfix.com
# ADMIN_PASSWORD=YourSecurePassword123
# ADMIN_USERNAME=admin
# ADMIN_PHONE=+1234567890

# Start the backend server
npm run dev
```

The backend will start on `http://localhost:5000`

### 2. Frontend Setup

```bash
# Open a new terminal and navigate to frontend directory
cd frontend

# Install dependencies
npm install

# For local development, .env.local is already configured
# It points to http://localhost:5000/api

# Start the frontend development server
npm run dev
```

The frontend will start on `http://localhost:5173`

### 3. Access the Admin Panel

1. Open your browser to `http://localhost:5173`
2. Click "Login" or navigate to `/admin/login`
3. Use the credentials configured in your backend `.env` file:
   - **Email/Username**: `admin@solfix.com` or `admin`
   - **Password**: The password you set in `ADMIN_PASSWORD`

## 🌐 Production Deployment (Render.com)

### Backend Deployment

1. **Push your code to GitHub**

2. **Create a new Web Service on Render:**
   - Name: `solfix-backend`
   - Environment: `Node`
   - Build Command: `npm install`
   - Start Command: `npm start`

3. **Add Environment Variables in Render Dashboard:**
   ```
   PORT=5000
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/solfix
   ADMIN_EMAIL=admin@solfix.com
   ADMIN_PASSWORD=YourSecurePassword123
   ADMIN_USERNAME=admin
   ADMIN_PHONE=+1234567890
   ALLOWED_ORIGINS=https://solfix-1.onrender.com,https://solfix.onrender.com
   BACKEND_URL=https://solfix.onrender.com
   ```

4. **Deploy** - Render will automatically deploy your backend

### Frontend Deployment

1. **Create a new Web Service on Render:**
   - Name: `solfix-frontend`
   - Environment: `Node`
   - Build Command: `npm run build`
   - Start Command: `npx serve dist`

2. **Add Environment Variables in Render Dashboard:**
   ```
   VITE_API_URL=https://solfix.onrender.com/api
   ```

3. **Deploy** - Render will automatically deploy your frontend

## 🔧 MongoDB Atlas Setup

1. **Create a free cluster** at [MongoDB Atlas](https://cloud.mongodb.com)

2. **Create a database user:**
   - Go to Database Access → Add New Database User
   - Set username and password (save these!)

3. **Whitelist your IP:**
   - Go to Network Access → Add IP Address
   - For development, you can use `0.0.0.0/0` (allow from anywhere)
   - For production, add Render's IP addresses

4. **Get your connection string:**
   - Go to Clusters → Connect → Connect your application
   - Copy the connection string
   - Replace `<password>` with your database user password
   - Replace `<dbname>` with `solfix`

## 🔐 Default Admin Credentials

After first deployment, the admin account is created with the credentials from your environment variables. The default values in the `.env` files are:

- **Email**: `admin@solfix.com`
- **Username**: `admin`
- **Password**: `Solfix@123` (CHANGE THIS IN PRODUCTION!)

## 📁 Project Structure

```
Solfix/
├── backend/
│   ├── api/
│   │   ├── admin/
│   │   │   ├── credentials.js
│   │   │   ├── login.js
│   │   │   ├── logout.js
│   │   │   ├── stats.js
│   │   │   └── verify.js
│   │   ├── applicants/
│   │   │   ├── [id].js
│   │   │   └── index.js
│   │   ├── lib/
│   │   │   └── db.js
│   │   └── health.js
│   ├── .env
│   ├── .gitignore
│   ├── index.js
│   ├── package.json
│   └── vercel.json
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   │   ├── Benefits.jsx
│   │   │   ├── BonusSection.jsx
│   │   │   ├── CourseSection.jsx
│   │   │   ├── CurriculumSection.jsx
│   │   │   ├── Footer.jsx
│   │   │   ├── Hero.jsx
│   │   │   ├── Loading.jsx
│   │   │   ├── Navbar.jsx
│   │   │   └── PaymentMethods.jsx
│   │   ├── pages/
│   │   │   ├── AdminDashboard.jsx
│   │   │   ├── AdminLogin.jsx
│   │   │   ├── Home.jsx
│   │   │   └── Register.jsx
│   │   ├── App.jsx
│   │   ├── config.js
│   │   └── main.jsx
│   ├── .env
│   ├── .env.local
│   ├── .gitignore
│   ├── index.html
│   ├── package.json
│   ├── README.md
│   └── vite.config.js
└── SETUP_GUIDE.md
```

## 🔍 Key Features

### Authentication System
- **Session-based authentication** with secure token generation
- **Persistent login** using localStorage
- **Automatic token refresh** and session validation
- **Secure password hashing** with bcryptjs

### Admin Dashboard
- **Real-time statistics** with visual cards
- **Applicant management** with search and filtering
- **Status updates** (Pending, Approved, Rejected)
- **Export to Excel** functionality
- **Profile settings** with password change

### UI/UX Improvements
- **Show/hide password toggle** on login page
- **Professional account dropdown** in navbar
- **Responsive design** for mobile and desktop
- **Loading states** and error handling
- **Cross-tab synchronization** for auth state

## 🐛 Troubleshooting

### "Failed to fetch" errors
1. Ensure backend is running on `http://localhost:5000`
2. Check that `VITE_API_URL` is correctly set in frontend
3. Verify MongoDB connection string is correct
4. Check browser console for CORS errors

### Login not working
1. Verify admin credentials in backend `.env`
2. Check MongoDB connection is successful
3. Ensure admin account was created (check MongoDB)
4. Clear browser localStorage and try again

### MongoDB connection issues
1. Verify connection string format
2. Check IP whitelist in MongoDB Atlas
3. Ensure database user has read/write permissions
4. Test connection using MongoDB Compass

## 📝 Environment Variables Reference

### Backend (.env)
```env
PORT=5000                                    # Server port
MONGODB_URI=mongodb+srv://...               # MongoDB connection string
ADMIN_EMAIL=admin@solfix.com                # Admin email
ADMIN_PASSWORD=Solfix@123                   # Admin password (CHANGE IN PROD!)
ADMIN_USERNAME=admin                        # Admin username
ADMIN_PHONE=+1234567890                     # Admin phone
ALLOWED_ORIGINS=https://...                 # CORS allowed origins
BACKEND_URL=https://solfix.onrender.com     # Public backend URL
```

### Frontend (.env)
```env
VITE_API_URL=https://solfix.onrender.com/api   # Backend API URL
```

### Frontend (.env.local) - Development only
```env
VITE_API_URL=http://localhost:5000/api      # Local backend URL
```

## 🔄 Updating After Changes

### Local Development
```bash
# Backend changes - server auto-reloads with nodemon
# Frontend changes - Vite auto-reloads

# If you need to restart:
# Backend: Ctrl+C, then npm run dev
# Frontend: Ctrl+C, then npm run dev
```

### Production (Render)
- Changes pushed to GitHub automatically trigger deployment
- Environment variable changes require manual redeploy in Render dashboard

## 📞 Support

For issues or questions:
1. Check the troubleshooting section above
2. Review the console logs in both frontend and backend
3. Verify all environment variables are correctly set
4. Ensure MongoDB connection is working

## 📄 License

This project is proprietary and confidential.