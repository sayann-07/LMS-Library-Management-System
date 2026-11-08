const { pool } = require('../config/db');

// @desc    Get all books (with optional search and category filters)
// @route   GET /api/books
// @access  Public
const getAllBooks = async (req, res, next) => {
  try {
    const { search, category } = req.query;

    let query = 'SELECT * FROM books WHERE 1=1';
    const params = [];

    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }

    if (search) {
      query += ' AND (title LIKE ? OR author LIKE ? OR isbn LIKE ?)';
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam, searchParam);
    }

    query += ' ORDER BY book_id ASC';

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

// @desc    Get single book by ID
// @route   GET /api/books/:id
// @access  Public
const getBookById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query('SELECT * FROM books WHERE book_id = ?', [id]);

    if (rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: `Book not found with ID: ${id}`
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

// @desc    Add a new book to the catalog
// @route   POST /api/books
// @access  Private (Admin only)
const createBook = async (req, res, next) => {
  try {
    const { title, author, isbn, category, total_copies } = req.body;

    if (!title || !author) {
      return res.status(400).json({
        status: 'error',
        message: 'Title and author are required fields'
      });
    }

    const copies = parseInt(total_copies, 10) || 1;

    const [result] = await pool.query(
      `INSERT INTO books (title, author, isbn, category, total_copies, available_copies)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [title, author, isbn || null, category || null, copies, copies]
    );

    res.status(201).json({
      status: 'success',
      message: 'Book added successfully',
      data: {
        book_id: result.insertId,
        title,
        author,
        isbn,
        category,
        total_copies: copies,
        available_copies: copies
      }
    });
  } catch (error) {
    // Handle duplicate ISBN error
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        status: 'error',
        message: 'A book with this ISBN already exists.'
      });
    }
    next(error);
  }
};

// @desc    Update a book
// @route   PUT /api/books/:id
// @access  Private (Admin only)
const updateBook = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, author, isbn, category, total_copies, available_copies } = req.body;

    const [existing] = await pool.query('SELECT * FROM books WHERE book_id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: `Book not found with ID: ${id}`
      });
    }

    await pool.query(
      `UPDATE books 
       SET title = COALESCE(?, title),
           author = COALESCE(?, author),
           isbn = COALESCE(?, isbn),
           category = COALESCE(?, category),
           total_copies = COALESCE(?, total_copies),
           available_copies = COALESCE(?, available_copies)
       WHERE book_id = ?`,
      [title, author, isbn, category, total_copies, available_copies, id]
    );

    res.status(200).json({
      status: 'success',
      message: 'Book updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a book
// @route   DELETE /api/books/:id
// @access  Private (Admin only)
const deleteBook = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if book has transactions
    const [transactions] = await pool.query(
      'SELECT transaction_id FROM transactions WHERE book_id = ? LIMIT 1',
      [id]
    );

    if (transactions.length > 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Cannot delete book with existing transaction history'
      });
    }

    const [result] = await pool.query('DELETE FROM books WHERE book_id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        status: 'error',
        message: `Book not found with ID: ${id}`
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Book deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllBooks,
  getBookById,
  createBook,
  updateBook,
  deleteBook
};

