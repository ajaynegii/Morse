# Deployment Guide: End-to-End Encrypted Chat Application

This guide provides instructions for deploying your Node.js backend and Next.js frontend chat application.

## 🌐 Cloud Database Setup (MongoDB Atlas Recommended)

For a robust, persistent, and accessible database, using a cloud-hosted MongoDB solution like MongoDB Atlas is highly recommended. It allows your application to work from **any device** and **persist data** in the cloud.

### Why MongoDB Atlas?

✅ **Free Tier Available**: Offers a generous free tier (M0) suitable for development and small projects (512MB storage).
✅ **Managed Service**: No need to worry about database server maintenance.
✅ **High Availability**: Data is replicated and accessible.
✅ **Scalability**: Easily upgrade as your needs grow.
✅ **Global Reach**: Deploy your database close to your users.

### Step-by-Step MongoDB Atlas Setup

1.  **Create MongoDB Atlas Account (Free)**
    *   Go to: [https://www.mongodb.com/atlas](https://www.mongodb.com/atlas)
    *   Click: "Try Free"
    *   Sign up with email or Google account (no credit card required for the free tier).

2.  **Create Free Database Cluster**
    *   After signing up, select the "FREE" tier (M0).
    *   Choose your preferred cloud provider (AWS, Google Cloud, or Azure).
    *   Select a region closest to your application's deployment location.
    *   Click "Create Cluster".
    *   Wait 2-3 minutes for the cluster to provision.

3.  **Set Up Database Access**
    *   In the left sidebar, go to "Database Access" under "Security".
    *   Click "Add New Database User".
    *   Choose "Password" as the authentication method.
    *   Create a **Username** (e.g., `messaging_user`).
    *   Create a **strong Password** (save this password securely!).
    *   Under "Database User Privileges", select "Read and write to any database".
    *   Click "Add User".

4.  **Set Up Network Access**
    *   In the left sidebar, go to "Network Access" under "Security".
    *   Click "Add IP Address".
    *   For development/testing, click "Allow Access from Anywhere" (this adds `0.0.0.0/0`). **For production, specify only your application's server IP addresses for enhanced security.**
    *   Click "Confirm".

5.  **Get Connection String**
    *   Go back to "Database" in the left sidebar (Overview).
    *   Click "Connect" on your newly created cluster.
    *   Choose "Connect your application".
    *   Select the Node.js driver version (keep it current).
    *   **Copy the connection string.**
    *   **Important**: Replace `<password>` in the connection string with the strong password you created in step 3.

### 6. Configure Backend Environment Variables

In your `backend/` directory, create a `.env` file (if you haven't already) and add your MongoDB Atlas connection string and your JWT secret:

```env
MONGODB_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_jwt_secret_key
```

*   Replace `your_mongodb_atlas_connection_string` with the full URI you copied and modified from Atlas.
*   Replace `your_jwt_secret_key` with a strong, random string. This is crucial for JWT security.

## Deployment Options

### Option 1: Local Development

To run the application locally for development and testing:

1.  **Backend (in `backend/` directory):**
    ```bash
    npm install
    npm run dev  # Uses nodemon for auto-restarts during development
    # or npm start for production-like run
    ```
2.  **Frontend (in `GUI/` directory, in a separate terminal):**
    ```bash
    npm install
    npm run dev
    ```
    Access the application at `http://localhost:3000`.

### Option 2: Deploying to a Cloud Provider (e.g., Vercel for Frontend, Render/Heroku for Backend)

This is the recommended approach for hosting your full-stack application.

#### Frontend (Next.js - Vercel Recommended)

1.  **Sign up for Vercel**: [https://vercel.com/signup](https://vercel.com/signup)
2.  **Import Your Project**: Connect your GitHub account and import the `Morse` repository.
3.  **Configure Build**: Vercel automatically detects Next.js projects. Ensure the root directory for the frontend build is set to `GUI/`.
4.  **Deploy**: Vercel will build and deploy your frontend. It handles environment variables, but for API calls, ensure your frontend points to your deployed backend URL (not `localhost`).
    *   You might need to adjust `SOCKET_SERVER_URL` and other `fetch` calls in your `GUI/` codebase to point to your *deployed backend URL* instead of `http://localhost:5000` once your backend is hosted.

#### Backend (Node.js - Render, Heroku, Cyclic, etc.)

1.  **Choose a Hosting Provider**: 
    *   **Render**: Excellent for Node.js apps, offers a free tier for web services. (https://render.com/)
    *   **Heroku**: Popular for Node.js, but free tier has limitations. (https://www.heroku.com/)
    *   **Cyclic**: Specifically designed for Node.js apps with MongoDB. (https://www.cyclic.sh/)

2.  **Connect GitHub**: Link your chosen provider to your GitHub repository.
3.  **Configure Deployment**: 
    *   Specify `backend/` as the root directory for the service.
    *   Set the **build command**: `npm install`
    *   Set the **start command**: `npm start`
    *   **Environment Variables**: Crucially, add `MONGODB_URI` and `JWT_SECRET` as environment variables directly in the hosting platform's settings (e.g., Render Dashboard, Heroku Config Vars). **Do NOT expose these in your code or public repository.**

4.  **Deploy**: Initiate the deployment. The platform will build and run your backend service.

### Option 3: Docker and VPS (Advanced)

For more control and custom configurations, you can containerize your application using Docker and deploy it to a Virtual Private Server (VPS).

1.  **Install Docker**: Install Docker on your development machine and the VPS.
2.  **Create Dockerfiles**: Create `Dockerfile`s for both your `backend` and `GUI` services.
3.  **Build Docker Images**: `docker build -t my-chat-backend ./backend` and `docker build -t my-chat-frontend ./GUI`
4.  **Docker Compose**: Use `docker-compose.yml` to orchestrate both services.
5.  **Deploy to VPS**: Copy Docker files to your VPS, build images, and run with `docker-compose up -d`.

## Troubleshooting Deployment

-   **Backend Not Starting**: Check server logs on your hosting platform for errors. Ensure environment variables are correctly set.
-   **Frontend Not Connecting to Backend**: Verify the `SOCKET_SERVER_URL` in `GUI/components/messaging-interface.tsx` (and any other API calls) points to your *deployed backend URL*, not `localhost`.
-   **Database Connection Issues**: Double-check your MongoDB Atlas connection string and network access settings on Atlas. Ensure the database user has correct permissions.
-   **File Uploads Not Working**: If deploying to a serverless platform, file uploads might require dedicated storage (e.g., AWS S3). Multer stores files locally, which might not persist on certain hosting types.

## Support

For specific deployment issues, refer to the documentation of your chosen hosting provider (e.g., Vercel docs, Render docs, Heroku docs).

## Data Persistence Features

### What Gets Stored
- ✅ **All messages** (encrypted and original)
- ✅ **Sender/receiver** information
- ✅ **Timestamps** for each message
- ✅ **Read status** tracking
- ✅ **Encryption keys** and compression data

### What Persists
- ✅ **Message history** across app restarts
- ✅ **User conversations** from any device
- ✅ **Statistics** and analytics
- ✅ **Settings** and preferences

### What's Shared
- ✅ **All users** see the same message history
- ✅ **Real-time** message synchronization
- ✅ **Cross-device** access to conversations
- ✅ **Centralized** data storage

## Security Features

### Data Protection
- 🔐 **Messages encrypted** before storage
- 🔐 **Connection string** in environment variables
- 🔐 **No sensitive data** in code repository
- 🔐 **MongoDB Atlas** security features

### Access Control
- 🔐 **Database user** with limited permissions
- 🔐 **Network access** controls
- 🔐 **Environment variable** protection
- 🔐 **No hardcoded** credentials

## Next Steps

1. **Set up Atlas** using the guide above
2. **Test connection** with provided scripts
3. **Deploy to GitHub** for sharing
4. **Share with others** using your connection string
5. **Monitor usage** in Atlas dashboard

## Support

- **MongoDB Atlas Docs**: https://docs.atlas.mongodb.com/
- **Free Tier Limits**: https://www.mongodb.com/atlas/pricing
- **Connection Issues**: Check network access settings
- **Performance**: Monitor in Atlas dashboard

Your messaging system will now work from **any device** and **persist all data** in the cloud! 🚀 