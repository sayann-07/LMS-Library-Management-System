/**
 * Security Audit Logger
 * Formats and records security-relevant events (authentication, authorization,
 * rate limiting, and administrative actions).
 * 
 * CRITICAL RULE: NEVER log passwords, full JWT tokens, or database credentials.
 */

const logSecurityEvent = (eventType, details = {}) => {
  const timestamp = new Date().toISOString();
  const safeDetails = { ...details };

  // Redact any accidental credential fields
  delete safeDetails.password;
  delete safeDetails.password_hash;
  delete safeDetails.token;
  delete safeDetails.authorization;

  const logEntry = {
    timestamp,
    level: details.severity || 'INFO',
    event: eventType,
    ip: details.ip || 'unknown',
    user: details.username || details.admin_id || 'anonymous',
    ...safeDetails
  };

  const output = `[SECURITY][${logEntry.level}] ${timestamp} - ${eventType}: ` +
    JSON.stringify(safeDetails);

  if (logEntry.level === 'CRITICAL' || logEntry.level === 'WARN') {
    console.warn(output);
  } else {
    console.log(output);
  }
};

module.exports = {
  logSecurityEvent
};

