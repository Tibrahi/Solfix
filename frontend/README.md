# Solfix - Course Registration System

A full-stack web application for Solfix Tech Company's course registration system, featuring a public registration form and an admin dashboard for managing applicants.

## Features

- **Public Registration Form**: Applicants can register for courses online
- **Admin Dashboard**: Secure admin panel to view and manage registrations
- **MongoDB Atlas Integration**: Persistent data storage with MongoDB Atlas
- **Responsive Design**: Works on desktop and mobile devices
- **Export to Excel**: Download applicant data as Excel files
- **Session-Based Authentication**: Secure admin authentication using crypto tokens (no JWT)

## Tech Stack

- **Frontend**: React 19, Vite, React Router, Tailwind CSS
- **Backend**: Node.js, Express.js
- **Database**: MongoDB Atlas
- **Authentication**: Session-based with crypto tokens stored in MongoDB

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- MongoDB Atlas account (free tier available)

## Setup Instructions

### 1. MongoDB Atlas Setup

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and create a free account
2. Create a new cluster (free tier M0 is sufficient)
3. Click on "Database Access" in the left sidebar and create a database user with username and password
4. Click on "Network Access" and add your IP address (or use 0.0.0.0/0 for development)
5. Click on "Clusters" → "Connect" → "Connect your application"
6. Copy the connection string (it looks like: `mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/`)
7. Replace `<password>` with your database user password

See [MONGODB_SETUP.md](./MONGODB_SETUP.md) for detailed instructions.

### 2. Backend Setup

```bash
# Navigate to server directory
cd server

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env and add your MongoDB Atlas connection string
# MONGODB_URI=mongodb+srv://<username>:<password>@<cluster-url>/solfix_db?retryWrites=true&w=majority

# Start the server
npm run dev
```

The server will start on `http://localhost:5000`

### 3. Frontend Setup

```bash
# Navigate back to project root
cd ..

# Install dependencies
npm install

# (Optional) Create .env.local to configure API URL
cp .env.example .env.local

# Start the development server
npm run dev
```

The frontend will start on `http://localhost:5173`

## Environment Variables

### Server (.env)

| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | Server port | `5000` |
| `NODE_ENV` | Environment | `development` |
| `MONGODB_URI` | MongoDB Atlas connection string | `mongodb+srv://...` |
| `ADMIN_EMAIL` | Admin email for login | `admin@solfix.com` |
| `ADMIN_PHONE` | Admin phone for login | `0788888888` |
| `ADMIN_USERNAME` | Admin username for login | `solfixadmin` |
| `ADMIN_PASSWORD` | Admin password (will be hashed) | `Admin@12345` |

### Frontend (.env.local - Optional)

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL | `http://localhost:5000/api` |

## API Endpoints

### Public Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/applicants` | Submit a new registration |
| `GET` | `/api/health` | Health check endpoint |

### Protected Endpoints (Requires Session Token)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/admin/login` | Admin login - returns session token |
| `POST` | `/api/admin/logout` | Admin logout - invalidates session |
| `GET` | `/api/admin/verify` | Verify session token |
| `GET` | `/api/applicants` | Get all applicants |
| `GET` | `/api/applicants/:id` | Get single applicant |
| `PATCH` | `/api/applicants/:id` | Update applicant status |
| `DELETE` | `/api/applicants/:id` | Delete applicant |
| `GET` | `/api/admin/stats` | Get dashboard statistics |
| `PUT` | `/api/admin/credentials` | Update admin credentials |

## Authentication

This application uses **session-based authentication** without JWT:

1. Admin logs in with credentials (email/phone/username + password)
2. Server validates credentials against MongoDB data
3. Server creates a session token (crypto random bytes) and stores it in MongoDB
4. Token is returned to client and stored in localStorage
5. Client sends token in `Authorization: Bearer <token>` header for protected requests
6. Server validates token against MongoDB sessions collection
7. Session expires after 24 hours

### Default Admin Credentials

After setup, you can log in with:
- **Email/Username/Phone**: `admin@solfix.com` or `solfixadmin` or `0788888888`
- **Password**: `Admin@12345`

**Important**: Change these credentials from the admin dashboard after first login!

## Project Structure

```
solfix/
├── src/                    # Frontend React code
│   ├── components/         # Reusable components
│   ├── pages/              # Page components
│   ├── config.js           # API configuration and helpers
│   ├── App.jsx             # Main app component
│   ├── main.jsx            # Entry point
│   └── index.css           # Global styles
├── server/                 # Backend Node.js code
│   ├── index.js            # Express server
│   ├── .env                # Environment variables
│   ├── .env.example        # Environment template
│   └── package.json        # Server dependencies
├── public/                 # Static assets
├── index.html              # HTML template
├── package.json            # Frontend dependencies
├── vite.config.js          # Vite configuration
├── .env.example            # Frontend env template
├── MONGODB_SETUP.md        # MongoDB setup guide
└── README.md               # This file
```

## Development

### Running in Development

```bash
# Terminal 1: Start backend server
cd server
npm install
npm run dev

# Terminal 2: Start frontend dev server
npm install
npm run dev
```

### Building for Production

```bash
# Build frontend
npm run build

# Start production server
cd server
npm install
npm start
```

## Troubleshooting

### "Failed to fetch" Errors

If you see "Failed to fetch" errors during login or form submission:

1. **Check if the backend server is running**:
   ```bash
   cd server
   npm run dev
   ```
   You should see: `📡 Server running on port 5000`

2. **Verify the API URL configuration**:
   - The frontend uses `http://localhost:5000/api` by default
   - If your backend runs on a different port, create `.env.local` in the project root:
     ```
     VITE_API_URL=http://localhost:YOUR_PORT/api
     ```

3. **Check MongoDB connection**:
   - Ensure your MongoDB Atlas connection string is correct in `server/.env`
   - Verify your IP is whitelisted in MongoDB Atlas Network Access
   - Check the server console for connection errors

4. **CORS issues**:
   - The server allows requests from `http://localhost:5173` (Vite default) and `http://localhost:3000`
   - If using a different port, update CORS configuration in `server/index.js`

### MongoDB Connection Issues

If you see "MongoDB URI not configured" warning:
1. Make sure you've copied the `.env.example` to `.env` in the server folder
2. Update the `MONGODB_URI` with your actual MongoDB Atlas connection string
3. Ensure your IP address is whitelisted in MongoDB Atlas Network Access

### Port Already in Use

If port 5000 or 5173 is already in use:
1. Change the `PORT` in `server/.env`
2. Vite will automatically find an available port for the frontend

## Security Notes

- Admin credentials are stored in MongoDB with bcrypt hashing
- Session tokens are cryptographically secure random bytes
- Sessions expire after 24 hours
- Passwords are never stored or transmitted in plain text
- CORS is configured to only allow specific origins

## License

ISC