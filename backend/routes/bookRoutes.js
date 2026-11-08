const express = require('express');
const router = express.Router();
const {
  getAllBooks,
  getBookById,
  createBook,
  updateBook,
  deleteBook
} = require('../controllers/bookController');
const { verifyToken } = require('../middleware/authMiddleware');
const { validateIdParam, validateBookInput } = require('../middleware/validationMiddleware');

// Public routes for catalog browsing
router.get('/', getAllBooks);
router.get('/:id', validateIdParam, getBookById);

// Admin protected routes for catalog management
router.post('/', verifyToken, validateBookInput(false), createBook);
router.put('/:id', verifyToken, validateIdParam, validateBookInput(true), updateBook);
router.delete('/:id', verifyToken, validateIdParam, deleteBook);

module.exports = router;
