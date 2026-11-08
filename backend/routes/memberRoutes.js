const express = require('express');
const router = express.Router();
const {
  getAllMembers,
  getMemberById,
  createMember,
  updateMember,
  deleteMember
} = require('../controllers/memberController');
const { verifyToken } = require('../middleware/authMiddleware');
const { validateIdParam, validateMemberInput } = require('../middleware/validationMiddleware');

// All member directory operations contain patron PII and require administrator authentication
router.get('/', verifyToken, getAllMembers);
router.get('/:id', verifyToken, validateIdParam, getMemberById);
router.post('/', verifyToken, validateMemberInput(false), createMember);
router.put('/:id', verifyToken, validateIdParam, validateMemberInput(true), updateMember);
router.delete('/:id', verifyToken, validateIdParam, deleteMember);

module.exports = router;
