/**
 * In-Memory Token Revocation / Blacklist Store
 * Prevents reuse of JWTs after explicit logout.
 * Automatically purges expired entries every hour to conserve memory.
 */

const { getJwtExpiresInMs } = require('./jwtConfig');

const revokedTokens = new Map(); // tokenString -> expiryTimestampMs

const revokeToken = (token, expiresInMs = getJwtExpiresInMs()) => {
  if (!token) return;
  const expiry = Date.now() + expiresInMs;
  revokedTokens.set(token, expiry);
};

const isTokenRevoked = (token) => {
  if (!token) return false;
  const expiry = revokedTokens.get(token);
  if (!expiry) return false;
  if (Date.now() > expiry) {
    revokedTokens.delete(token);
    return false;
  }
  return true;
};

// Periodic cleanup of expired tokens every 60 minutes
setInterval(() => {
  const now = Date.now();
  for (const [tok, exp] of revokedTokens.entries()) {
    if (now > exp) {
      revokedTokens.delete(tok);
    }
  }
}, 60 * 60 * 1000).unref();

module.exports = {
  revokeToken,
  isTokenRevoked
};

