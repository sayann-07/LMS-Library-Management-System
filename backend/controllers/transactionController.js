const { pool } = require('../config/db');

// @desc    Get all transactions with book and member details
// @route   GET /api/transactions
// @access  Public
const getAllTransactions = async (req, res, next) => {
  try {
    const query = `
      SELECT 
        t.transaction_id,
        t.book_id,
        b.title AS book_title,
        b.isbn AS book_isbn,
        t.member_id,
        m.name AS member_name,
        m.email AS member_email,
        t.issue_date,
        t.due_date,
        t.return_date,
        t.status
      FROM transactions t
      JOIN books b ON t.book_id = b.book_id
      JOIN members m ON t.member_id = m.member_id
      ORDER BY t.transaction_id DESC
    `;

    const [rows] = await pool.query(query);

    res.status(200).json({
      status: 'success',
      count: rows.length,
      data: rows
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get transaction by ID
// @route   GET /api/transactions/:id
// @access  Public
const getTransactionById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const query = `
      SELECT 
        t.transaction_id,
        t.book_id,
        b.title AS book_title,
        t.member_id,
        m.name AS member_name,
        t.issue_date,
        t.due_date,
        t.return_date,
        t.status
      FROM transactions t
      JOIN books b ON t.book_id = b.book_id
      JOIN members m ON t.member_id = m.member_id
      WHERE t.transaction_id = ?
    `;

    const [rows] = await pool.query(query, [id]);

    if (rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: `Transaction not found with ID: ${id}`
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

// @desc    Issue a book to a member
// @route   POST /api/transactions/issue
// @access  Private (Admin only)
const issueBook = async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    const { book_id, member_id, due_date } = req.body;

    if (!book_id || !member_id || !due_date) {
      return res.status(400).json({
        status: 'error',
        message: 'book_id, member_id, and due_date are required'
      });
    }

    // Begin database transaction
    await connection.beginTransaction();

    // Check book availability
    const [bookRows] = await connection.query(
      'SELECT available_copies FROM books WHERE book_id = ? FOR UPDATE',
      [book_id]
    );

    if (bookRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        status: 'error',
        message: 'Book not found'
      });
    }

    if (bookRows[0].available_copies <= 0) {
      await connection.rollback();
      return res.status(400).json({
        status: 'error',
        message: 'No copies of this book are currently available for issue.'
      });
    }

    // Check member exists
    const [memberRows] = await connection.query(
      'SELECT member_id FROM members WHERE member_id = ?',
      [member_id]
    );

    if (memberRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        status: 'error',
        message: 'Member not found'
      });
    }

    const today = new Date().toISOString().split('T')[0];

    // Create transaction record
    const [result] = await connection.query(
      `INSERT INTO transactions (book_id, member_id, issue_date, due_date, status)
       VALUES (?, ?, ?, ?, 'Issued')`,
      [book_id, member_id, today, due_date]
    );

    // Decrement available copies
    await connection.query(
      'UPDATE books SET available_copies = available_copies - 1 WHERE book_id = ?',
      [book_id]
    );

    await connection.commit();

    res.status(201).json({
      status: 'success',
      message: 'Book issued successfully',
      data: {
        transaction_id: result.insertId,
        book_id,
        member_id,
        issue_date: today,
        due_date,
        status: 'Issued'
      }
    });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
};

// @desc    Record return of an issued book
// @route   PUT /api/transactions/return/:id
// @access  Private (Admin only)
const returnBook = async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    const { id } = req.params;

    await connection.beginTransaction();

    const [txRows] = await connection.query(
      'SELECT transaction_id, book_id, status FROM transactions WHERE transaction_id = ? FOR UPDATE',
      [id]
    );

    if (txRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        status: 'error',
        message: 'Transaction not found'
      });
    }

    const tx = txRows[0];
    if (tx.status === 'Returned') {
      await connection.rollback();
      return res.status(400).json({
        status: 'error',
        message: 'This book has already been returned.'
      });
    }

    const today = new Date().toISOString().split('T')[0];

    // Update transaction
    await connection.query(
      `UPDATE transactions 
       SET return_date = ?, status = 'Returned' 
       WHERE transaction_id = ?`,
      [today, id]
    );

    // Increment available copies
    await connection.query(
      'UPDATE books SET available_copies = available_copies + 1 WHERE book_id = ?',
      [tx.book_id]
    );

    await connection.commit();

    res.status(200).json({
      status: 'success',
      message: 'Book marked as returned successfully'
    });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
};

module.exports = {
  getAllTransactions,
  getTransactionById,
  issueBook,
  returnBook
};

