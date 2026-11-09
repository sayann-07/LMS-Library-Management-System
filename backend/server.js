const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');

// Load backend environment variables
dotenv.config({ path: path.resolve(__dirname, '.env') });

// Strict production secret enforcement
if (
  process.env.NODE_ENV === 'production' &&
  (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'fallback_secret_for_development_only' || process.env.JWT_SECRET.length < 16)
) {
  console.error('========================================================================');
  console.error('FATAL SECURITY CONFIGURATION ERROR:');
  console.error('JWT_SECRET must be set to a cryptographically secure string (>= 16 chars) in production.');
  console.error('========================================================================');
  process.exit(1);
}

const { pool, testConnection } = require('./config/db');
const { logSecurityEvent } = require('./utils/securityLogger');

// Import modular routes
const authRoutes = require('./routes/authRoutes');
const bookRoutes = require('./routes/bookRoutes');
const memberRoutes = require('./routes/memberRoutes');
const transactionRoutes = require('./routes/transactionRoutes');

// Import centralized error handling middleware
const { notFoundHandler, errorHandler } = require('./middleware/errorMiddleware');

const app = express();
const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0';

// ---------------------------------------------------------------------------
// Reverse Proxy Configuration (Render / Reverse Proxy Deployments)
// ---------------------------------------------------------------------------
// Trust the first-hop reverse proxy to accurately identify client IPs from the
// X-Forwarded-For header, preventing express-rate-limit ERR_ERL_UNEXPECTED_X_FORWARDED_FOR
// while guarding against upstream IP spoofing.
app.set('trust proxy', 1);

// ---------------------------------------------------------------------------
// Security Headers via Helmet (Hardened Production Profile)
// ---------------------------------------------------------------------------
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        imgSrc: ["'self'", 'data:', 'https:', 'blob:'],
        connectSrc: ["'self'", 'http://localhost:*', 'https://*.vercel.app', 'https://*.onrender.com']
      }
    },
    xContentTypeOptions: true,
    dnsPrefetchControl: { allow: false },
    frameguard: { action: 'deny' },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    },
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    hidePoweredBy: true
  })
);

// ---------------------------------------------------------------------------
// CORS Configuration
// ---------------------------------------------------------------------------
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, server-to-server) or matching allowed origins
      if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
        callback(null, true);
      } else {
        // In production, allow trusted Vercel / Render domains
        if (origin.endsWith('.vercel.app') || origin.endsWith('.onrender.com')) {
          return callback(null, true);
        }
        logSecurityEvent('CORS_ORIGIN_BLOCKED', { origin, severity: 'WARN' });
        callback(new Error(`Origin ${origin} not allowed by CORS policy`));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

// Body parser with strict size limits to prevent Out-Of-Memory DoS
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// ---------------------------------------------------------------------------
// Rate Limiters
// ---------------------------------------------------------------------------

// 1. Strict Authentication Rate Limiter (Mitigate brute-force attacks)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'test' ? 1000 : 30, // 30 in production, relaxed in automated test runs
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logSecurityEvent('AUTH_RATE_LIMIT_EXCEEDED', {
      ip: req.ip || req.connection.remoteAddress,
      severity: 'WARN'
    });
    res.status(429).json({
      status: 'error',
      message: 'Too many authentication attempts. Please try again after 15 minutes.'
    });
  }
});

// 2. General API Rate Limiter (Protects against scraping and DoS)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // Limit each IP to 300 API requests per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logSecurityEvent('API_RATE_LIMIT_EXCEEDED', {
      ip: req.ip || req.connection.remoteAddress,
      endpoint: req.originalUrl,
      severity: 'WARN'
    });
    res.status(429).json({
      status: 'error',
      message: 'API rate limit exceeded. Please try again later.'
    });
  }
});

app.use('/api/', apiLimiter);

// ---------------------------------------------------------------------------
// Health Check Endpoint (Verifies MySQL Database Connectivity)
// ---------------------------------------------------------------------------
app.get('/api/health', async (req, res) => {
  try {
    const [result] = await pool.query('SELECT 1 AS db_status');
    res.status(200).json({
      status: 'success',
      message: 'Library Management System API and MySQL connection healthy',
      database: 'connected',
      db_check: result[0]?.db_status === 1 ? 'OK' : 'UNKNOWN',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (error) {
    console.error('[Health Check Error] Database connection failed:', error.message);
    res.status(503).json({
      status: 'error',
      message: 'Library Management System API is running, but database connection failed',
      database: 'disconnected',
      timestamp: new Date().toISOString()
    });
  }
});

// ---------------------------------------------------------------------------
// API Routes
// ---------------------------------------------------------------------------
app.use('/api/auth/login', authLimiter);
app.use('/api/auth', authRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/transactions', transactionRoutes);

// Root fallback
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'success',
    name: 'Library Management System API',
    version: '1.0.0',
    documentation: '/api/health',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      books: '/api/books',
      members: '/api/members',
      transactions: '/api/transactions'
    }
  });
});

// ---------------------------------------------------------------------------
// Centralized Error Handling
// ---------------------------------------------------------------------------
app.use(notFoundHandler);
app.use(errorHandler);

// ---------------------------------------------------------------------------
// Server Initialization
// ---------------------------------------------------------------------------
const startServer = async () => {
  await testConnection();

  const server = app.listen(PORT, HOST, () => {
    console.log('====================================================');
    console.log(`  Library Management System Backend Server Started  `);
    console.log(`  Listening on: http://${HOST}:${PORT}               `);
    console.log(`  Health Check: http://${HOST}:${PORT}/api/health    `);
    console.log(`  Environment:  ${process.env.NODE_ENV || 'development'}     `);
    console.log(`  Trust Proxy:  ${app.get('trust proxy')} (Render 1-hop configured) `);
    console.log('====================================================');
  });

  // Graceful shutdown handling
  const gracefulShutdown = async (signal) => {
    console.log(`\n[Server] Received ${signal}. Closing HTTP server and database pool gracefully...`);
    server.close(async () => {
      try {
        await pool.end();
        console.log('[Database] MySQL connection pool closed successfully.');
        process.exit(0);
      } catch (err) {
        console.error('[Database] Error closing connection pool:', err.message);
        process.exit(1);
      }
    });
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
};

startServer();

module.exports = app;
