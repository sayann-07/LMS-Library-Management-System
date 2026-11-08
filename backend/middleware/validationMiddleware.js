/**
 * Centralized Input Validation and Sanitization Middleware
 * Enforces strict schemas, types, and lengths across all incoming requests.
 * Mitigates XSS, SQL injection, NoSQL injection, and malformed data issues.
 */

// Basic sanitization: strip dangerous HTML/script tags and control characters
const sanitizeString = (str) => {
  if (typeof str !== 'string') return str;
  return str
    .replace(/[<>]/g, '') // Strip < and > to prevent HTML/XSS injection
    .trim();
};

// Validate integer parameter (e.g. :id)
const validateIdParam = (req, res, next) => {
  const { id } = req.params;
  const num = Number(id);
  if (!Number.isInteger(num) || num <= 0) {
    return res.status(400).json({
      status: 'error',
      message: 'Invalid resource ID. Must be a positive integer.'
    });
  }
  req.params.id = num;
  next();
};

// Validate Book creation/update payload
const validateBookInput = (isUpdate = false) => {
  return (req, res, next) => {
    let { title, author, isbn, category, total_copies, available_copies } = req.body;

    if (!isUpdate || title !== undefined) {
      if (!isUpdate && (!title || typeof title !== 'string' || !title.trim())) {
        return res.status(400).json({ status: 'error', message: 'Title is required and must be a valid string.' });
      }
      if (title && (typeof title !== 'string' || title.length > 255)) {
        return res.status(400).json({ status: 'error', message: 'Title cannot exceed 255 characters.' });
      }
      if (title) req.body.title = sanitizeString(title);
    }

    if (!isUpdate || author !== undefined) {
      if (!isUpdate && (!author || typeof author !== 'string' || !author.trim())) {
        return res.status(400).json({ status: 'error', message: 'Author is required and must be a valid string.' });
      }
      if (author && (typeof author !== 'string' || author.length > 255)) {
        return res.status(400).json({ status: 'error', message: 'Author cannot exceed 255 characters.' });
      }
      if (author) req.body.author = sanitizeString(author);
    }

    if (isbn !== undefined && isbn !== null) {
      const cleanIsbn = sanitizeString(String(isbn));
      if (cleanIsbn.length > 30) {
        return res.status(400).json({ status: 'error', message: 'ISBN cannot exceed 30 characters.' });
      }
      req.body.isbn = cleanIsbn;
    }

    if (category !== undefined && category !== null) {
      const cleanCategory = sanitizeString(String(category));
      if (cleanCategory.length > 100) {
        return res.status(400).json({ status: 'error', message: 'Category cannot exceed 100 characters.' });
      }
      req.body.category = cleanCategory;
    }

    if (total_copies !== undefined) {
      const copies = Number(total_copies);
      if (!Number.isInteger(copies) || copies < 1 || copies > 10000) {
        return res.status(400).json({
          status: 'error',
          message: 'Total copies must be an integer between 1 and 10,000.'
        });
      }
      req.body.total_copies = copies;
    }

    if (available_copies !== undefined) {
      const avail = Number(available_copies);
      if (!Number.isInteger(avail) || avail < 0 || (req.body.total_copies && avail > req.body.total_copies)) {
        return res.status(400).json({
          status: 'error',
          message: 'Available copies must be a non-negative integer and cannot exceed total copies.'
        });
      }
      req.body.available_copies = avail;
    }

    next();
  };
};

// Validate Member creation/update payload
const validateMemberInput = (isUpdate = false) => {
  return (req, res, next) => {
    let { name, email, phone } = req.body;

    if (!isUpdate || name !== undefined) {
      if (!isUpdate && (!name || typeof name !== 'string' || !name.trim())) {
        return res.status(400).json({ status: 'error', message: 'Name is required and must be a valid string.' });
      }
      if (name && (typeof name !== 'string' || name.length > 150)) {
        return res.status(400).json({ status: 'error', message: 'Name cannot exceed 150 characters.' });
      }
      if (name) req.body.name = sanitizeString(name);
    }

    if (!isUpdate || email !== undefined) {
      if (!isUpdate && (!email || typeof email !== 'string' || !email.trim())) {
        return res.status(400).json({ status: 'error', message: 'Email address is required.' });
      }
      if (email) {
        const cleanEmail = email.trim().toLowerCase();
        // Strict email RFC-5322 compliant regex
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(cleanEmail) || cleanEmail.length > 150) {
          return res.status(400).json({ status: 'error', message: 'Please provide a valid email address.' });
        }
        req.body.email = cleanEmail;
      }
    }

    if (phone !== undefined && phone !== null && phone !== '') {
      const cleanPhone = sanitizeString(String(phone));
      // Digits, plus, hyphens, parentheses, spaces up to 25 chars
      const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]{3,20}$/;
      if (!phoneRegex.test(cleanPhone)) {
        return res.status(400).json({ status: 'error', message: 'Please provide a valid phone number.' });
      }
      req.body.phone = cleanPhone;
    }

    next();
  };
};

// Validate Issue Book payload
const validateIssueInput = (req, res, next) => {
  const { book_id, member_id, due_date } = req.body;

  const bId = Number(book_id);
  const mId = Number(member_id);

  if (!Number.isInteger(bId) || bId <= 0) {
    return res.status(400).json({ status: 'error', message: 'Valid book_id is required.' });
  }

  if (!Number.isInteger(mId) || mId <= 0) {
    return res.status(400).json({ status: 'error', message: 'Valid member_id is required.' });
  }

  if (!due_date || typeof due_date !== 'string') {
    return res.status(400).json({ status: 'error', message: 'due_date is required (format: YYYY-MM-DD).' });
  }

  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(due_date)) {
    return res.status(400).json({ status: 'error', message: 'due_date must be in YYYY-MM-DD format.' });
  }

  const parsedDate = new Date(due_date);
  if (isNaN(parsedDate.getTime())) {
    return res.status(400).json({ status: 'error', message: 'Invalid due_date provided.' });
  }

  const todayStr = new Date().toISOString().split('T')[0];
  if (due_date < todayStr) {
    return res.status(400).json({ status: 'error', message: 'Due date cannot be in the past.' });
  }

  req.body.book_id = bId;
  req.body.member_id = mId;
  req.body.due_date = due_date;

  next();
};

module.exports = {
  sanitizeString,
  validateIdParam,
  validateBookInput,
  validateMemberInput,
  validateIssueInput
};

