const express = require('express');
const router = express.Router();
const {
  loginAdmin,
  getAdminProfile,
  logoutAdmin,
  changePassword
} = require('../controllers/authController');
const { verifyToken } = require('../middleware/authMiddleware');

// Public route: Admin login
router.post('/login', loginAdmin);

// Protected routes
router.get('/profile', verifyToken, getAdminProfile);
router.post('/logout', verifyToken, logoutAdmin);
router.post('/change-password', verifyToken, changePassword);

module.exports = router;
