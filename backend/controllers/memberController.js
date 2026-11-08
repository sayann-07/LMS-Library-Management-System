const { pool } = require('../config/db');

// @desc    Get all members
// @route   GET /api/members
// @access  Public
const getAllMembers = async (req, res, next) => {
  try {
    const { search } = req.query;

    let query = 'SELECT * FROM members WHERE 1=1';
    const params = [];

    if (search) {
      query += ' AND (name LIKE ? OR email LIKE ? OR phone LIKE ?)';
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam, searchParam);
    }

    query += ' ORDER BY member_id ASC';

    const [rows] = await pool.query(query, params);

    res.status(200).json({
      status: 'success',
      count: rows.length,
      data: rows
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single member by ID
// @route   GET /api/members/:id
// @access  Public
const getMemberById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query('SELECT * FROM members WHERE member_id = ?', [id]);

    if (rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: `Member not found with ID: ${id}`
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

// @desc    Register a new member
// @route   POST /api/members
// @access  Private (Admin only)
const createMember = async (req, res, next) => {
  try {
    const { name, email, phone } = req.body;

    if (!name || !email) {
      return res.status(400).json({
        status: 'error',
        message: 'Name and email are required fields'
      });
    }

    const [result] = await pool.query(
      'INSERT INTO members (name, email, phone) VALUES (?, ?, ?)',
      [name, email, phone || null]
    );

    res.status(201).json({
      status: 'success',
      message: 'Member registered successfully',
      data: {
        member_id: result.insertId,
        name,
        email,
        phone
      }
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        status: 'error',
        message: 'A member with this email already exists.'
      });
    }
    next(error);
  }
};

// @desc    Update a member
// @route   PUT /api/members/:id
// @access  Private (Admin only)
const updateMember = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, email, phone } = req.body;

    const [existing] = await pool.query('SELECT * FROM members WHERE member_id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: `Member not found with ID: ${id}`
      });
    }

    await pool.query(
      `UPDATE members 
       SET name = COALESCE(?, name),
           email = COALESCE(?, email),
           phone = COALESCE(?, phone)
       WHERE member_id = ?`,
      [name, email, phone, id]
    );

    res.status(200).json({
      status: 'success',
      message: 'Member updated successfully'
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        status: 'error',
        message: 'Another member is already using this email.'
      });
    }
    next(error);
  }
};

// @desc    Delete a member
// @route   DELETE /api/members/:id
// @access  Private (Admin only)
const deleteMember = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [transactions] = await pool.query(
      'SELECT transaction_id FROM transactions WHERE member_id = ? LIMIT 1',
      [id]
    );

    if (transactions.length > 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Cannot delete member with associated borrowing history.'
      });
    }

    const [result] = await pool.query('DELETE FROM members WHERE member_id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        status: 'error',
        message: `Member not found with ID: ${id}`
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Member deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllMembers,
  getMemberById,
  createMember,
  updateMember,
  deleteMember
};

