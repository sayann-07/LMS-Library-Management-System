/**
 * JWT Configuration and Expiration Validation Utility
 *
 * Provides robust parsing, normalization, and validation for JWT_EXPIRES_IN.
 * Solves production deployment errors (Render/Vercel/Heroku):
 *   "expiresIn" should be a number of seconds or string representing a timespan eg: "1d", "20h"
 *
 * Guarantees:
 * - Safe default of "1d" if missing, null, undefined, empty, or invalid.
 * - Strips surrounding quotes (e.g. '"1d"', "'1d'") from environment variables.
 * - Trims whitespace (e.g. ' 1d ').
 * - Normalizes pure digit strings (e.g. '86400', '3600') to integer seconds.
 * - Never returns undefined, null, or invalid values for jwt.sign().
 */

const DEFAULT_JWT_EXPIRES_IN = '1d';
const DEFAULT_JWT_EXPIRES_IN_MS = 24 * 60 * 60 * 1000;

// Timespan unit multipliers in milliseconds
const UNIT_MS = {
  ms: 1,
  msec: 1,
  msecs: 1,
  millisecond: 1,
  milliseconds: 1,
  s: 1000,
  sec: 1000,
  secs: 1000,
  second: 1000,
  seconds: 1000,
  m: 60 * 1000,
  min: 60 * 1000,
  mins: 60 * 1000,
  minute: 60 * 1000,
  minutes: 60 * 1000,
  h: 60 * 60 * 1000,
  hr: 60 * 60 * 1000,
  hrs: 60 * 60 * 1000,
  hour: 60 * 60 * 1000,
  hours: 60 * 60 * 1000,
  d: 24 * 60 * 60 * 1000,
  day: 24 * 60 * 60 * 1000,
  days: 24 * 60 * 60 * 1000,
  w: 7 * 24 * 60 * 60 * 1000,
  week: 7 * 24 * 60 * 60 * 1000,
  weeks: 7 * 24 * 60 * 60 * 1000,
  y: 365.25 * 24 * 60 * 60 * 1000,
  yr: 365.25 * 24 * 60 * 60 * 1000,
  yrs: 365.25 * 24 * 60 * 60 * 1000,
  year: 365.25 * 24 * 60 * 60 * 1000,
  years: 365.25 * 24 * 60 * 60 * 1000
};

const TIMESPAN_REGEX = /^(\d+(?:\.\d+)?)\s*([a-z]+)$/i;

/**
 * Validates and normalizes the JWT expiration value.
 *
 * @param {string|number|undefined|null} rawValue - Raw JWT_EXPIRES_IN value.
 * @returns {string|number} A safe, validated timespan string (e.g. '1d', '20h') or integer seconds.
 */
function getValidJwtExpiresIn(rawValue = process.env.JWT_EXPIRES_IN) {
  if (rawValue === undefined || rawValue === null) {
    return DEFAULT_JWT_EXPIRES_IN;
  }

  // Already an integer number of seconds
  if (typeof rawValue === 'number') {
    return Number.isInteger(rawValue) && rawValue > 0 ? rawValue : DEFAULT_JWT_EXPIRES_IN;
  }

  if (typeof rawValue !== 'string') {
    return DEFAULT_JWT_EXPIRES_IN;
  }

  // Strip surrounding quotes and whitespace (frequent in deployment environment variables)
  const cleaned = rawValue.trim().replace(/^['"]+|['"]+$/g, '').trim();

  if (!cleaned || cleaned.toLowerCase() === 'undefined' || cleaned.toLowerCase() === 'null') {
    return DEFAULT_JWT_EXPIRES_IN;
  }

  // Pure digits: convert to integer seconds
  if (/^\d+$/.test(cleaned)) {
    const seconds = parseInt(cleaned, 10);
    return seconds > 0 ? seconds : DEFAULT_JWT_EXPIRES_IN;
  }

  // Timespan string validation (e.g. '1d', '20h', '15m', '60s')
  const match = TIMESPAN_REGEX.exec(cleaned);
  if (match) {
    const num = parseFloat(match[1]);
    const unit = match[2].toLowerCase();
    if (!isNaN(num) && num > 0 && UNIT_MS[unit]) {
      return cleaned;
    }
  }

  // Any unrecognized or invalid value falls back safely to '1d'
  return DEFAULT_JWT_EXPIRES_IN;
}

/**
 * Converts the JWT expiration duration into milliseconds.
 *
 * @param {string|number|undefined|null} rawValue
 * @returns {number} Expiration duration in milliseconds.
 */
function getJwtExpiresInMs(rawValue = process.env.JWT_EXPIRES_IN) {
  const validated = getValidJwtExpiresIn(rawValue);

  if (typeof validated === 'number') {
    return validated * 1000;
  }

  const match = TIMESPAN_REGEX.exec(validated);
  if (match) {
    const num = parseFloat(match[1]);
    const unit = match[2].toLowerCase();
    if (UNIT_MS[unit]) {
      return Math.round(num * UNIT_MS[unit]);
    }
  }

  return DEFAULT_JWT_EXPIRES_IN_MS;
}

module.exports = {
  getValidJwtExpiresIn,
  getJwtExpiresInMs,
  DEFAULT_JWT_EXPIRES_IN,
  DEFAULT_JWT_EXPIRES_IN_MS
};

