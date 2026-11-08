# Production Deployment Guide: Library Management System

This comprehensive, step-by-step guide is written specifically for beginners. It walks you through deploying your Library Management System to production on the cloud for **100% free** using standard industry platforms:

- **Frontend**: [Vercel](https://vercel.com) (Global Edge CDN for React + Vite)
- **Backend API**: [Render](https://render.com) (Free Node.js Web Service)
- **Database**: [Aiven](https://aiven.io) or [TiDB Cloud](https://tidbcloud.com) (Free Managed Cloud MySQL 8.0)
- **Source Control**: [GitHub](https://github.com)

---

## Table of Contents
1. [Prerequisites & Repository Preparation](#1-prerequisites--repository-preparation)
2. [Step 1: Set Up Free Cloud MySQL Database (Aiven)](#step-1-set-up-free-cloud-mysql-database)
3. [Step 2: Import Database Schema & Seed Data](#step-2-import-database-schema--seed-data)
4. [Step 3: Deploy Backend API on Render](#step-3-deploy-backend-api-on-render)
5. [Step 4: Deploy Frontend on Vercel](#step-4-deploy-frontend-on-vercel)
6. [Step 5: Connect Frontend & Backend (CORS Finalization)](#step-5-connect-frontend--backend)
7. [Step 6: Live Smoke Testing & Verification](#step-6-live-smoke-testing--verification)
8. [Troubleshooting & Common Pitfalls](#troubleshooting--common-pitfalls)
9. [Production Security Checklist](#production-security-checklist)

---

## 1. Prerequisites & Repository Preparation

### A. Push Project to GitHub
1. Create a GitHub account at [https://github.com](https://github.com) if you do not have one.
2. Create a new repository named `library-management-system` (set it to **Private** or **Public**).
3. In your local terminal inside `d:\library-management-system`, initialize git and push:
```bash
git init
git add .
git commit -m "feat: complete production-ready library management system"
git branch -M main
git remote add origin https://github.com/<YOUR_GITHUB_USERNAME>/library-management-system.git
git push -u origin main
```

> [!NOTE]
> Your `.gitignore` is already pre-configured to automatically exclude local `.env` files and `node_modules`. No database passwords or secrets will be committed to GitHub.

---

## Step 1: Set Up Free Cloud MySQL Database

We will use **Aiven for MySQL** (or **TiDB Cloud**). Both provide a managed MySQL database with SSL encryption.

### A. Create Aiven Account
1. Open [https://aiven.io](https://aiven.io) in your browser.
2. Click **Start free trial** or **Sign Up** (Sign in with Google or GitHub).
3. In the Aiven Console, click the **Create service** button in the top right.

### B. Configure Service
1. **Select Service**: Choose **MySQL**.
2. **Cloud Provider & Region**: Choose **AWS** or **Google Cloud**, and pick the region geographically closest to you (e.g. `us-east-1` or `eu-west-1` or `ap-southeast-1`).
3. **Service Plan**: Choose **Free Tier** (or Startup).
4. **Service Name**: Enter `library-db-prod`.
5. Click **Create service**.

### C. Retrieve Database Credentials
Once the service status turns green (**Running**), locate the **Connection Information** panel:
- **Host**: (e.g., `mysql-xxxx.aivencloud.com`)
- **Port**: (e.g., `12345`)
- **User**: `avnadmin`
- **Password**: *(Click the eye icon to reveal and copy)*
- **Database Name**: `defaultdb` (or create `library_db`)
- **Service URI / DATABASE_URL**: `mysql://avnadmin:PASSWORD@HOST:PORT/defaultdb?ssl-mode=REQUIRED`

Keep this browser tab open; you will need these credentials in Step 3.

---

## Step 2: Import Database Schema & Seed Data

You must create the 4 database tables (`admins`, `books`, `members`, `transactions`) and insert the initial catalog records.

### Method A: Using Aiven Web Console
1. In your Aiven Service overview, click on the **Databases** tab on the left.
2. Click **Create Database**, type `library_db`, and click **Save**.
3. Use any MySQL client (e.g. MySQL Workbench, DBeaver, or table creation interface) or Method B.

### Method B: From Your Local Terminal
Run the following commands locally, replacing the host, port, and password with your Aiven credentials:

```bash
# 1. Import Schema (Tables, Primary Keys, Foreign Keys, Indexes)
mysql -h <AIVEN_HOST> -P <AIVEN_PORT> -u avnadmin -p library_db < database/schema.sql

# 2. Import Seed Data (Initial Books, Members, and Admin Account)
mysql -h <AIVEN_HOST> -P <AIVEN_PORT> -u avnadmin -p library_db < database/seed.sql
```

> [!TIP]
> The seeded administrator credentials are:
> - **Username**: `admin`
> - **Password**: `admin1123`

---

## Step 3: Deploy Backend API on Render

Render will host the Node.js Express API.

### A. Create Render Account
1. Go to [https://render.com](https://render.com) and click **Get Started**.
2. Sign in with your **GitHub** account so Render can access your repository.

### B. Create Web Service
1. In your Render Dashboard, click the **New +** button in the top bar.
2. Select **Web Service**.
3. Under **Connect a repository**, find your `library-management-system` repository and click **Connect**.

### C. Configure Web Service Settings
Fill in the exact fields as shown below:

| Setting | Value to Enter |
| :--- | :--- |
| **Name** | `library-management-backend` |
| **Region** | Same region as your database (e.g. `Ohio (US East)` or `Oregon`) |
| **Branch** | `main` |
| **Root Directory** | `backend` *(Critical: Do not leave blank!)* |
| **Runtime** | `Node` |
| **Build Command** | `npm install` |
| **Start Command** | `npm start` |
| **Instance Type** | `Free` |

### D. Enter Backend Environment Variables
Scroll down to the **Environment Variables** section and click **Add Environment Variable** for each of the following:

| Key | Value | Purpose |
| :--- | :--- | :--- |
| `NODE_ENV` | `production` | Enables production optimizations & error handling |
| `PORT` | `10000` | Render assigns this automatically |
| `HOST` | `0.0.0.0` | Binds server to all network interfaces |
| `DATABASE_URL` | `mysql://avnadmin:PASS@HOST:PORT/library_db` | Your full Aiven connection string |
| `DB_SSL` | `true` | Required for secure cloud database connections |
| `JWT_SECRET` | *(Generate a 32+ character random string)* | Used to sign admin session tokens |
| `JWT_EXPIRES_IN` | `1d` | Token lifespan |
| `FRONTEND_URL` | `http://localhost:5173` | We will update this in Step 5 |

4. Click **Create Web Service**.
5. Render will now clone the repository, run `npm install`, and execute `npm start`.
6. Watch the deployment logs. When you see:
   ```text
   [Database] Successfully connected to MySQL database: library_db
   Library Management System Backend Server Started
   ```
7. Copy your public Backend URL from the top of the Render page:
   `https://library-management-backend-xxxx.onrender.com`

---

## Step 4: Deploy Frontend on Vercel

Vercel will build and distribute your React frontend globally.

### A. Create Vercel Account
1. Go to [https://vercel.com](https://vercel.com) and click **Sign Up**.
2. Select **Continue with GitHub**.

### B. Import Repository
1. In the Vercel Dashboard, click **Add New...** -> **Project**.
2. Locate `library-management-system` and click **Import**.

### C. Configure Project Settings
In the Project Configuration screen:
1. **Project Name**: `library-management-system`
2. **Framework Preset**: `Vite` (automatically detected)
3. **Root Directory**: Click **Edit** next to Root Directory, select the **`frontend`** folder, and click **Continue**.
4. **Build and Output Settings**:
   - Build Command: `npm run build` (Default)
   - Output Directory: `dist` (Default)
   - Install Command: `npm install` (Default)

### D. Enter Frontend Environment Variable
Expand the **Environment Variables** section and add:

| Key | Value |
| :--- | :--- |
| `VITE_API_URL` | `https://library-management-backend-xxxx.onrender.com/api` *(Your Render URL + `/api`)* |

> [!IMPORTANT]
> Make sure your `VITE_API_URL` ends with `/api`. For example:
> `https://library-management-backend-xxxx.onrender.com/api`

5. Click **Deploy**.
6. Vercel will build your application in under 45 seconds. Once finished, click **Continue to Dashboard** or **Visit**.
7. Copy your production frontend URL (e.g., `https://library-management-system-xxxx.vercel.app`).

---

## Step 5: Connect Frontend & Backend

Now that your frontend has a live public URL, authorize it in your backend's CORS whitelist so API requests are accepted.

1. Go back to your [Render Dashboard](https://dashboard.render.com).
2. Click on your `library-management-backend` service.
3. Click on the **Environment** tab on the left menu.
4. Find the `FRONTEND_URL` variable.
5. Click the edit icon, update the value to your live Vercel URL:
   `https://library-management-system-xxxx.vercel.app`
6. Click **Save Changes**. Render will automatically trigger a zero-downtime redeploy.

---

## Step 6: Live Smoke Testing & Verification

Once both deployments are active:

1. **Test API Health**:
   Open `https://library-management-backend-xxxx.onrender.com/api/health` in your browser.
   You should see:
   ```json
   {
     "status": "success",
     "message": "Library Management System API and MySQL connection healthy",
     "database": "connected",
     "db_check": "OK"
   }
   ```

2. **Open Frontend App**:
   Navigate to your Vercel URL (`https://library-management-system-xxxx.vercel.app`).
   - You should see the login screen with the library showcase image.
   - Enter credentials:
     - **Username**: `admin`
     - **Password**: `admin1123`
   - Click **Access Management Portal**.

3. **Verify Core DBMS Operations**:
   - **Dashboard**: Verify the 3 metric cards display live stock counts from MySQL.
   - **Books Catalog**: Add a test book, edit a title, verify availability count.
   - **Members Directory**: Enroll a patron with an email address.
   - **Book Circulation**: Issue a book to the member. Verify that the book's `available_copies` decrements in real time.
   - **Book Return**: Click **Return**, confirm return, and verify that `available_copies` increments back.

---

## Troubleshooting & Common Pitfalls

### Issue 1: "Network Error" or "Failed to fetch" on Frontend
- **Cause**: Incorrect `VITE_API_URL` in Vercel, or missing `/api` suffix.
- **Fix**: In Vercel Project Settings -> **Environment Variables**, verify `VITE_API_URL` is set to `https://<YOUR_RENDER_BACKEND>.onrender.com/api`. After modifying, go to **Deployments** and click **Redeploy**.

### Issue 2: Render Free Tier "Cold Starts"
- **Cause**: On Render's free tier, backend instances spin down after 15 minutes of inactivity. The first request after sleep may take 30-45 seconds to wake up.
- **Fix**: Wait 30 seconds on initial load, or set up a free uptime monitor (such as [UptimeRobot](https://uptimerobot.com)) to ping `https://<YOUR_RENDER_BACKEND>.onrender.com/api/health` every 10 minutes.

### Issue 3: MySQL "SSL Connection Error"
- **Cause**: Remote cloud databases (Aiven, PlanetScale, AWS RDS) reject unencrypted plaintext connections.
- **Fix**: Ensure `DB_SSL=true` is set in Render environment variables. Our `backend/config/db.js` pool configuration automatically applies `{ rejectUnauthorized: false }` when SSL is enabled.

### Issue 4: Page Refresh on `/books` or `/transactions` returns 404
- **Cause**: Single-Page Applications (SPA) need the server to rewrite all requests back to `/index.html`.
- **Fix**: `frontend/vercel.json` and `frontend/public/_redirects` are already committed to the repository to handle this automatically on both Vercel and Netlify.

---

## Production Security Checklist

- [x] **Zero Plaintext Passwords**: Passwords in `admins` table are hashed using salted bcrypt (10 rounds).
- [x] **Zero Hardcoded Secrets**: All database passwords, tokens, and endpoints load from environment variables.
- [x] **Rate Limiting**: Express brute-force limiter limits login attempts to 30 requests per 15 minutes per IP.
- [x] **Parameterized Queries**: All SQL statements use `?` placeholders; zero string concatenation to prevent SQL injection.
- [x] **Relational Integrity**: Foreign keys with `ON DELETE RESTRICT` prevent orphaned records or deleting books with active loans.
- [x] **HTTP Security Headers**: `helmet` headers protect against clickjacking, MIME-sniffing, and cross-site scripting (XSS).
- [x] **Secure Token Expiry**: JWT tokens expire after 24 hours (`1d`).

