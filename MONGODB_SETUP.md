# MongoDB Atlas Setup Guide

This guide will help you configure MongoDB Atlas for the Solfix application.

## Step-by-Step Instructions

### 1. Create a MongoDB Atlas Account

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register)
2. Sign up for a free account (you can use Google, GitHub, or email)
3. Complete the registration process

### 2. Create a New Cluster

1. After logging in, click **"Create a cluster"** or **"+ CREATE"** button
2. Choose the **FREE** tier (M0 Sandbox)
3. Select a cloud provider (AWS, Google Cloud, or Azure) - any is fine
4. Choose a region close to your location for better performance
5. Give your cluster a name (or use the default)
6. Click **"Create Cluster"** (this may take a few minutes)

### 3. Create a Database User

1. In the left sidebar, click **"Database Access"** under Security
2. Click **"+ ADD NEW DATABASE USER"**
3. Choose **"Password"** authentication method
4. Enter a username (e.g., `solfixadmin`)
5. Enter a strong password (save this - you'll need it later)
6. Set **"Database User Privileges"** to **"Atlas admin"** or **"Read and write to any database"**
7. Click **"Add User"**

### 4. Configure Network Access

1. In the left sidebar, click **"Network Access"** under Security
2. Click **"+ ADD IP ADDRESS"**
3. Choose one of:
   - **"Allow Access from Anywhere"** (0.0.0.0/0) - recommended for development
   - **"Add Current IP Address"** - more secure, but you'll need to update if your IP changes
4. Click **"Confirm"**

### 5. Get the Connection String

1. Go back to **"Database"** in the left sidebar
2. Click the **"Connect"** button on your cluster
3. Select **"Connect your application"**
4. Choose **"Node.js"** driver and version **"6.0 or later"**
5. Copy the connection string. It looks like:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```

### 6. Configure Your Application

1. Navigate to your project's server directory:
   ```bash
   cd server
   ```

  2. Open the `.env` file and update the `MONGODB_URI` variable:
     ```
     MONGODB_URI=mongodb+srv://solfixadmin:YourPassword@cluster0.xxxxx.mongodb.net/solfix_db?retryWrites=true&w=majority
     ```

     Replace:
     - `solfixadmin` with your database username
     - `YourPassword` with your database password (make sure to URL-encode special characters if your password contains them)
     - `cluster0.xxxxx` with your actual cluster URL

  3. **Important**: The database name (`solfix_db`) will be created automatically when you first submit data.

  4. **Note**: If your password contains special characters (like @, #, $, %, etc.), you must URL-encode them:
     - `@` becomes `%40`
     - `#` becomes `%23`
     - `$` becomes `%24`
     - `%` becomes `%25`
     - `&` becomes `%26`
     - `=` becomes `%3D`

### 7. Test the Connection

1. Start the server:
   ```bash
   cd server
   npm run dev
   ```

2. You should see:
   ```
   ✅ Connected to MongoDB Atlas
   🚀 Server running with MongoDB Atlas
   ```

3. If you see a warning about MongoDB URI not configured, double-check your `.env` file.

## Troubleshooting

### "Invalid credentials" error
- Double-check your username and password in the connection string
- Make sure there are no extra spaces in the `.env` file

### "Network timeout" error
- Check that your IP address is whitelisted in MongoDB Atlas Network Access
- Try using 0.0.0.0/0 to allow access from anywhere (for development)

### "DNS not found" error
- Make sure you copied the full connection string correctly
- Check that your cluster name is correct

### Connection still not working
1. Go to MongoDB Atlas → Database Access
2. Edit your user and reset the password
3. Update the `.env` file with the new password
4. Restart the server

## Security Best Practices

1. **Never commit `.env` files** - The `.env` file is in `.gitignore` for a reason
2. **Use strong passwords** - Your database password should be at least 12 characters
3. **Restrict IP access in production** - Don't use 0.0.0.0/0 in production
4. **Use environment-specific credentials** - Have different credentials for dev/staging/production

## Free Tier Limits

MongoDB Atlas free tier (M0) includes:
- 512 MB storage
- Shared RAM
- Shared vCPU
- No backups (but you can export data manually)

This is sufficient for development and small applications.

## Additional Resources

- [MongoDB Atlas Documentation](https://www.mongodb.com/docs/atlas/)
- [MongoDB Connection String Reference](https://www.mongodb.com/docs/manual/reference/connection-string/)