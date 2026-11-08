const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');
const { isTokenRevoked } = require('../utils/tokenBlacklist');
const { logSecurityEvent } = require('../utils/securityLogger');

const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      status: 'error',
      message: 'Access denied. No authentication token provided.'
    });
  }

  const token = authHeader.split(' ')[1];

  // 1. Check if token was revoked via logout
  if (isTokenRevoked(token)) {
    logSecurityEvent('TOKEN_REVOKED_ACCESS_ATTEMPT', {
      ip: req.ip || req.connection.remoteAddress,
      severity: 'WARN'
    });
    return res.status(401).json({
      status: 'error',
      message: 'Session has been invalidated. Please log in again.'
    });
  }

  try {
    const secret = process.env.JWT_SECRET;
    if (!secret && process.env.NODE_ENV === 'production') {
      throw new Error('JWT_SECRET is not configured on the production server.');
    }

    const decoded = jwt.verify(token, secret || 'fallback_secret_for_development_only');

    // 2. Database verification: ensure admin still exists
    const [rows] = await pool.query(
      'SELECT admin_id, username FROM admins WHERE admin_id = ? LIMIT 1',
      [decoded.admin_id]
    );

    if (rows.length === 0) {
      logSecurityEvent('ORPHANED_TOKEN_ACCESS_ATTEMPT', {
        admin_id: decoded.admin_id,
        ip: req.ip || req.connection.remoteAddress,
        severity: 'WARN'
      });
      return res.status(401).json({
        status: 'error',
        message: 'Account no longer exists. Access revoked.'
      });
    }

    req.admin = rows[0];
    req.token = token;
    next();
  } catch (error) {
    return res.status(401).json({
      status: 'error',
      message: 'Invalid or expired token. Please log in again.'
    });
  }
};

module.exports = {
  verifyToken
};
