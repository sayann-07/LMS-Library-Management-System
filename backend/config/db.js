const path = require('path');
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

// Explicitly resolve and load backend/.env
dotenv.config({ path: path.resolve(__dirname, '../.env') });

/**
 * Configure database connection pool
 * Supports either a direct DATABASE_URL (common in cloud providers like Render/Railway/Aiven)
 * or individual host/port/user/password parameters.
 */
const buildPoolConfig = () => {
  const isSslEnabled =
    process.env.DB_SSL === 'true' ||
    (process.env.DB_HOST && process.env.DB_HOST !== 'localhost' && process.env.DB_HOST !== '127.0.0.1');

  if (process.env.DATABASE_URL) {
    return {
      uri: process.env.DATABASE_URL,
      waitForConnections: true,
      connectionLimit: Number(process.env.DB_CONNECTION_LIMIT) || 10,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 10000,
      ssl: isSslEnabled ? { rejectUnauthorized: false } : undefined
    };
  }

  return {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'library_db',
    waitForConnections: true,
    connectionLimit: Number(process.env.DB_CONNECTION_LIMIT) || 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000,
    ssl: isSslEnabled ? { rejectUnauthorized: false } : undefined
  };
};

const pool = mysql.createPool(buildPoolConfig());

/**
 * Helper function to test database connectivity at boot time
 */
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    const dbName = process.env.DB_NAME || 'library_db';
    console.log(`[Database] Successfully connected to MySQL database: ${dbName}`);
    connection.release();
    return true;
  } catch (error) {
    console.error(`[Database] Connection failed: ${error.message}`);
    console.warn('[Database] Verify database credentials and host connectivity in your environment configuration.');
    return false;
  }
};

module.exports = {
  pool,
  testConnection
};
