const express = require('express');
const router = express.Router();
const {
  getAllTransactions,
  getTransactionById,
  issueBook,
  returnBook
} = require('../controllers/transactionController');
const { verifyToken } = require('../middleware/authMiddleware');
const { validateIdParam, validateIssueInput } = require('../middleware/validationMiddleware');

// Circulation transactions require administrator authentication
router.get('/', verifyToken, getAllTransactions);
router.get('/:id', verifyToken, validateIdParam, getTransactionById);
router.post('/issue', verifyToken, validateIssueInput, issueBook);
router.put('/return/:id', verifyToken, validateIdParam, returnBook);

module.exports = router;
