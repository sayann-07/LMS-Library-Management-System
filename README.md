# Library Management System (DBMS Proj

A complete, full-stack college DBMS project for managing a library's book inventory, student/faculty memberships, and borrowing transactions with referential integrity.

---

## 1. Project Overview

The **Library Management System** is built to replace manual register-keeping with a robust relational database management system. It provides an intuitive web interface for library administrators to:
- Browse and manage books in the library catalog.
- Register and view member records.
- Track book borrowings (issue and return) with due dates and real-time inventory counts (`available_copies`).
- Prevent concurrent over-issuance and enforce relational constraints.

---

## 2. Technology Stack

### Frontend
- **Framework**: React.js 18
- **Build Tool**: Vite 6
- **Styling**: Tailwind CSS
- **HTTP Client**: Axios (pre-configured with interceptors)
- **Routing**: React Router DOM v6
- **Icons**: Lucide React

### Backend
- **Runtime**: Node.js (v18+)
- **Framework**: Express.js
- **Database Driver**: `mysql2` (with connection pooling and async/await promises)
- **Security & Auth**: `bcrypt` (salted password hashing), `jsonwebtoken` (JWT)
- **CORS**: `cors` middleware
- **Configuration**: `dotenv`
- **Development Monitor**: `nodemon`

### Database
- **Engine**: MySQL 8.0
- **Database Name**: `library_db`
- **Tables**: `admins`, `books`, `members`, `transactions`

---

## 3. Folder Structure

```text
library-management-system/
│
├── frontend/
│   ├── public/
│   │   └── vite.svg
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── DashboardLayout.jsx
│   │   │   │   └── ProtectedRoute.jsx
│   │   │   ├── common/
│   │   │   └── forms/
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Books.jsx
│   │   │   ├── Members.jsx
│   │   │   ├── Transactions.jsx
│   │   │   └── NotFound.jsx
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── context/
│   │   ├── hooks/
│   │   ├── utils/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── .env.example
│   ├── .gitignore
│   ├── index.html
│   ├── package.json
│   ├── postcss.config.js
│   ├── tailwind.config.js
│   └── vite.config.js
│
├── backend/
│   ├── config/
│   │   └── db.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── bookController.js
│   │   ├── memberController.js
│   │   └── transactionController.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── bookRoutes.js
│   │   ├── memberRoutes.js
│   │   └── transactionRoutes.js
│   ├── middleware/
│   │   ├── authMiddleware.js
│   │   └── errorMiddleware.js
│   ├── utils/
│   ├── server.js
│   ├── .env.example
│   ├── .gitignore
│   └── package.json
│
├── database/
│   ├── schema.sql
│   ├── seed.sql
│   └── README.md
│
├── docs/
│   ├── API_DOCUMENTATION.md
│   └── DATABASE_DOCUMENTATION.md
│
├── .gitignore
└── README.md
```

---

## 4. Prerequisites

Before running this project, ensure you have the following installed on your machine:
1. **Node.js**: v18.0.0 or higher ([Download Node.js](https://nodejs.org/))
2. **npm**: v9.0.0 or higher (bundled with Node.js)
3. **MySQL Server 8.0**: Running locally on port `3306` with database `library_db`

---

## 5. Installation & Setup

### Step 1: Clone or Navigate to the Workspace
```bash
cd library-management-system
```

### Step 2: Install Backend Dependencies
```bash
cd backend
npm install
```

### Step 3: Install Frontend Dependencies
```bash
cd ../frontend
npm install
```

---

## 6. Environment Variable Setup

### Backend Environment Configuration
1. Navigate to the `backend` folder:
   ```bash
   cd backend
   ```
2. Create a `.env` file by copying `.env.example`:
   ```bash
   # On Windows PowerShell:
   Copy-Item .env.example .env

   # On Linux/macOS:
   cp .env.example .env
   ```
3. Open `backend/.env` and update your MySQL password:
   ```env
   PORT=5000
   NODE_ENV=development

   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=your_actual_mysql_password
   DB_NAME=library_db
   DB_CONNECTION_LIMIT=10

   JWT_SECRET=super_secret_jwt_key_for_dev
   JWT_EXPIRES_IN=1d

   FRONTEND_URL=http://localhost:5173
   ```

### Frontend Environment Configuration
1. Navigate to the `frontend` folder:
   ```bash
   cd ../frontend
   ```
2. Create a `.env` file by copying `.env.example`:
   ```bash
   # On Windows PowerShell:
   Copy-Item .env.example .env

   # On Linux/macOS:
   cp .env.example .env
   ```
3. The default value connects to the backend API:
   ```env
   VITE_API_URL=http://localhost:5000/api
   ```

---

## 7. Administrator Credentials & Database Verification

### Default Login
- **Username**: `admin`
- **Password**: `admin1123`

To verify the MySQL database connection and schema:
1. Open MySQL Workbench or MySQL Command Line.
2. Run:
   ```sql
   USE library_db;
   SHOW TABLES;
   ```
3. You should see 4 tables: `admins`, `books`, `members`, `transactions`.
4. Production schema and seed records are preserved in `database/schema.sql` and `database/seed.sql`.

---

## 8. Running the Application Locally

### Automated Full-System Test Suite
Run the automated verification suite to test database connectivity, CRUD, authentication, and token authorization:
```bash
npm run verify:backend
```

### Option A: Launch All Services (One Click)
```bash
start.bat
```
or
```bash
npm run dev
```

### Option B: Start Services Individually
```bash
# Terminal 1 - Backend API (Port 5000)
cd backend
npm run dev

# Terminal 2 - Frontend UI (Port 5173)
cd frontend
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 9. Cloud Deployment Guide

A beginner-friendly, step-by-step deployment guide with screenshots, official links, and exact button clicks is provided in **[DEPLOYMENT.md](DEPLOYMENT.md)**:
- **Frontend**: Deployed to [Vercel](https://vercel.com) (SPA routing configured in `frontend/vercel.json`)
- **Backend**: Deployed to [Render](https://render.com) (Express API with 0.0.0.0 binding and Helmet security)
- **Database**: Cloud MySQL hosted on [Aiven](https://aiven.io) or [TiDB Cloud](https://tidbcloud.com) with SSL

---

## 10. Implementation Status

- [x] **Phase 1: Project Architecture & Relational Schema** (MySQL 8.0 `library_db` with foreign keys and cascade rules).
- [x] **Phase 2: Authentication & Security** (JWT tokens, salted bcrypt hashing, brute-force rate-limiting, Helmet headers).
- [x] **Phase 3: Catalog Management** (Books CRUD, live search, category filtering, stock tracking).
- [x] **Phase 4: Patron Directory** (Members CRUD, email uniqueness, contact tracking).
- [x] **Phase 5: Circulation Engine** (ACID transactional book checkouts, renewals, inventory auto-adjustment, return tracking).
- [x] **Phase 6: UI Design & Accessibility** (WCAG AA compliant warm ivory/beige aesthetic, 100% fluid responsive tables).
- [x] **Phase 7: Performance & Production Deployment Readiness** (Code-split routes, vendor chunking, Vercel & Render configs).

