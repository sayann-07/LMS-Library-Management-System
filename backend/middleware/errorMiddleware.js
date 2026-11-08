const { logSecurityEvent } = require('../utils/securityLogger');

// Middleware to handle 404 - Not Found routes
const notFoundHandler = (req, res, next) => {
  const error = new Error(`Resource not found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

// Centralized error handler
const errorHandler = (err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;

  // Log error details securely server-side
  console.error(`[Error] ${req.method} ${req.url} -> ${err.message}`);
  if (process.env.NODE_ENV !== 'production' && err.stack) {
    console.error(err.stack);
  }

  // Check for potential database or injection errors
  if (err.code && (err.code.startsWith('ER_') || err.code === 'ECONNREFUSED')) {
    logSecurityEvent('DATABASE_ERROR_INTERCEPTED', {
      method: req.method,
      url: req.originalUrl,
      code: err.code,
      severity: 'WARN'
    });
  }

  // In production, avoid leaking internal implementation details
  const clientMessage =
    process.env.NODE_ENV === 'production' && statusCode === 500
      ? 'An unexpected internal server error occurred. Please contact the administrator.'
      : err.message || 'Internal Server Error';

  res.status(statusCode).json({
    status: 'error',
    message: clientMessage,
    ...(process.env.NODE_ENV === 'development' && {
      code: err.code,
      stack: err.stack
    })
  });
};

module.exports = {
  notFoundHandler,
  errorHandler
};
