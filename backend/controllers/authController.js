const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');
const { revokeToken } = require('../utils/tokenBlacklist');
const { logSecurityEvent } = require('../utils/securityLogger');

// Dummy hash for constant-time comparison when user does not exist (mitigate username enumeration timing attacks)
const DUMMY_HASH = '$2b$10$e8N8gJek.PqA1zTf62d1uOCn69hWk1jVlmvJNuUjNrmuGq7PZ3vce';

// @desc    Admin login
// @route   POST /api/auth/login
// @access  Public
const loginAdmin = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    const clientIp = req.ip || req.connection.remoteAddress;

    if (!username || !password || typeof username !== 'string' || typeof password !== 'string') {
      return res.status(400).json({
        status: 'error',
        message: 'Username and password are required'
      });
    }

    const cleanUsername = username.trim();

    // Parameterized SQL query
    const [rows] = await pool.query(
      'SELECT admin_id, username, password_hash FROM admins WHERE username = ? LIMIT 1',
      [cleanUsername]
    );

    if (rows.length === 0) {
      // Execute dummy bcrypt to equalize timing and mitigate username enumeration
      await bcrypt.compare(password, DUMMY_HASH);
      logSecurityEvent('AUTH_LOGIN_FAILED_NONEXISTENT_USER', {
        username: cleanUsername,
        ip: clientIp,
        severity: 'WARN'
      });
      return res.status(401).json({
        status: 'error',
        message: 'Invalid credentials'
      });
    }

    const admin = rows[0];
    const isMatch = await bcrypt.compare(password, admin.password_hash);

    if (!isMatch) {
      logSecurityEvent('AUTH_LOGIN_FAILED_BAD_PASSWORD', {
        username: cleanUsername,
        ip: clientIp,
        severity: 'WARN'
      });
      return res.status(401).json({
        status: 'error',
        message: 'Invalid credentials'
      });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret && process.env.NODE_ENV === 'production') {
      throw new Error('JWT_SECRET is not configured on the production server.');
    }

    const token = jwt.sign(
      { admin_id: admin.admin_id, username: admin.username },
      secret || 'fallback_secret_for_development_only',
      { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
    );

    logSecurityEvent('AUTH_LOGIN_SUCCESS', {
      admin_id: admin.admin_id,
      username: admin.username,
      ip: clientIp
    });

    res.status(200).json({
      status: 'success',
      message: 'Login successful',
      data: {
        token,
        admin: {
          admin_id: admin.admin_id,
          username: admin.username
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current admin profile
// @route   GET /api/auth/profile
// @access  Private (Protected by verifyToken)
const getAdminProfile = async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      'SELECT admin_id, username, created_at FROM admins WHERE admin_id = ? LIMIT 1',
      [req.admin.admin_id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Admin account not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: rows[0]
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin logout (Revokes current JWT server-side)
// @route   POST /api/auth/logout
// @access  Private (Protected by verifyToken)
const logoutAdmin = async (req, res, next) => {
  try {
    if (req.token) {
      revokeToken(req.token);
    }

    logSecurityEvent('AUTH_LOGOUT', {
      admin_id: req.admin?.admin_id,
      username: req.admin?.username,
      ip: req.ip || req.connection.remoteAddress
    });

    res.status(200).json({
      status: 'success',
      message: 'Logged out successfully. Session invalidated.'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Change admin password
// @route   POST /api/auth/change-password
// @access  Private (Protected by verifyToken)
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const clientIp = req.ip || req.connection.remoteAddress;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        status: 'error',
        message: 'Current password and new password are required'
      });
    }

    if (typeof newPassword !== 'string' || newPassword.length < 8) {
      return res.status(400).json({
        status: 'error',
        message: 'New password must be at least 8 characters in length'
      });
    }

    // Retrieve existing hash
    const [rows] = await pool.query(
      'SELECT password_hash FROM admins WHERE admin_id = ? LIMIT 1',
      [req.admin.admin_id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Admin account not found'
      });
    }

    const isMatch = await bcrypt.compare(currentPassword, rows[0].password_hash);
    if (!isMatch) {
      logSecurityEvent('AUTH_PASSWORD_CHANGE_FAILED', {
        admin_id: req.admin.admin_id,
        ip: clientIp,
        severity: 'WARN'
      });
      return res.status(400).json({
        status: 'error',
        message: 'Current password provided is incorrect'
      });
    }

    // Hash new password with bcrypt 10 rounds
    const saltRounds = 10;
    const newHash = await bcrypt.hash(newPassword, saltRounds);

    await pool.query(
      'UPDATE admins SET password_hash = ? WHERE admin_id = ?',
      [newHash, req.admin.admin_id]
    );

    // Invalidate current session token so re-login is required
    if (req.token) {
      revokeToken(req.token);
    }

    logSecurityEvent('AUTH_PASSWORD_CHANGED', {
      admin_id: req.admin.admin_id,
      username: req.admin.username,
      ip: clientIp
    });

    res.status(200).json({
      status: 'success',
      message: 'Password changed successfully. Please log in with your new credentials.'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  loginAdmin,
  getAdminProfile,
  logoutAdmin,
  changePassword
};
