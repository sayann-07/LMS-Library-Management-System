/**
 * Production Authentication & Proxy Fix Verification Suite
 *
 * Verifies fixes for:
 * 1. Error 1: JWT expiration error ("expiresIn" should be a number of seconds or string representing a timespan)
 * 2. Error 2: Express trust proxy error (ERR_ERL_UNEXPECTED_X_FORWARDED_FOR)
 */

const http = require('http');
const path = require('path');
const jwt = require('jsonwebtoken');
const { getValidJwtExpiresIn, getJwtExpiresInMs } = require('../utils/jwtConfig');
const app = require('../server');

async function runTests() {
  console.log('================================================================');
  console.log('  STARTING PRODUCTION AUTH & PROXY FIX VERIFICATION SUITE');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, details = '') {
    if (condition) {
      console.log(`  [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${testName} ${details ? '(' + details + ')' : ''}`);
      failed++;
    }
  }

  // ---------------------------------------------------------------------------
  // SECTION 1: JWT Expiration Handling & Edge Cases
  // ---------------------------------------------------------------------------
  console.log('1. JWT Expiration Normalization & Signing Resilience:');

  const edgeCases = [
    { label: 'undefined value', input: undefined, expected: '1d' },
    { label: 'null value', input: null, expected: '1d' },
    { label: 'empty string', input: '', expected: '1d' },
    { label: 'whitespace only', input: '   ', expected: '1d' },
    { label: 'string "undefined"', input: 'undefined', expected: '1d' },
    { label: 'string "null"', input: 'null', expected: '1d' },
    { label: 'double-quoted string "1d"', input: '"1d"', expected: '1d' },
    { label: "single-quoted string '1d'", input: "'1d'", expected: '1d' },
    { label: 'padded string " 1d "', input: ' 1d ', expected: '1d' },
    { label: 'standard timespan "20h"', input: '20h', expected: '20h' },
    { label: 'standard timespan "15m"', input: '15m', expected: '15m' },
    { label: 'standard timespan "60s"', input: '60s', expected: '60s' },
    { label: 'numeric string "3600"', input: '3600', expected: 3600 },
    { label: 'numeric integer 3600', input: 3600, expected: 3600 },
    { label: 'numeric string "86400"', input: '86400', expected: 86400 },
    { label: 'numeric 0 (invalid)', input: 0, expected: '1d' },
    { label: 'numeric string "0" (invalid)', input: '0', expected: '1d' },
    { label: 'negative number (invalid)', input: -10, expected: '1d' },
    { label: 'invalid format "forever"', input: 'forever', expected: '1d' },
    { label: 'invalid format "24h00m"', input: '24h00m', expected: '1d' },
    { label: 'object type {}', input: {}, expected: '1d' }
  ];

  const dummySecret = 'test_verification_secret_min_16_chars_long';

  for (const tc of edgeCases) {
    const validated = getValidJwtExpiresIn(tc.input);
    let signSuccess = false;
    let decodedExp = null;

    try {
      const token = jwt.sign(
        { admin_id: 1, username: 'admin' },
        dummySecret,
        { expiresIn: validated }
      );
      const decoded = jwt.decode(token);
      decodedExp = decoded.exp;
      signSuccess = typeof token === 'string' && typeof decodedExp === 'number';
    } catch (err) {
      signSuccess = false;
    }

    assert(
      signSuccess && validated === tc.expected,
      `Handles ${tc.label} safely -> expiresIn: ${JSON.stringify(validated)}`,
      `Got ${JSON.stringify(validated)}, expected ${JSON.stringify(tc.expected)}`
    );
  }

  // Verify getJwtExpiresInMs
  console.log('\n2. Token Blacklist / Cache Millisecond Conversion:');
  assert(getJwtExpiresInMs('1d') === 86400000, 'getJwtExpiresInMs("1d") === 86,400,000 ms');
  assert(getJwtExpiresInMs('20h') === 72000000, 'getJwtExpiresInMs("20h") === 72,000,000 ms');
  assert(getJwtExpiresInMs('3600') === 3600000, 'getJwtExpiresInMs("3600") === 3,600,000 ms');
  assert(getJwtExpiresInMs(undefined) === 86400000, 'getJwtExpiresInMs(undefined) defaults to 24h ms');
  assert(getJwtExpiresInMs('invalid') === 86400000, 'getJwtExpiresInMs("invalid") defaults safely to 24h ms');

  // ---------------------------------------------------------------------------
  // SECTION 3: Trust Proxy & Rate Limiter Verification (Render Compatibility)
  // ---------------------------------------------------------------------------
  console.log('\n3. Express Trust Proxy & X-Forwarded-For Rate Limiting:');

  // 1. Check Express trust proxy setting on the app
  const trustProxySetting = app.get('trust proxy');
  assert(
    trustProxySetting === 1,
    `Express 'trust proxy' is configured to 1 (current: ${trustProxySetting})`
  );

  // 2. Spawn a test server instance from app to test live proxy request handling
  const server = await new Promise((resolve) => {
    const s = app.listen(0, '127.0.0.1', () => resolve(s));
  });
  const port = server.address().port;

  function doRequest(options, postData = null) {
    return new Promise((resolve, reject) => {
      const opts = { ...options, port, hostname: '127.0.0.1' };
      opts.headers = { ...(options.headers || {}) };

      let payload = null;
      if (postData) {
        payload = JSON.stringify(postData);
        opts.headers['Content-Type'] = 'application/json';
        opts.headers['Content-Length'] = Buffer.byteLength(payload);
      }

      const req = http.request(opts, (res) => {
        let body = '';
        res.on('data', (c) => (body += c));
        res.on('end', () => {
          let json = null;
          try {
            json = JSON.parse(body);
          } catch {}
          resolve({ statusCode: res.statusCode, headers: res.headers, body, json });
        });
      });

      req.on('error', reject);
      if (payload) req.write(payload);
      req.end();
    });
  }

  try {
    // Make request simulating Render reverse proxy: client IP 198.51.100.42 behind Render proxy 10.0.0.1
    const proxyResponse = await doRequest({
      path: '/api/health',
      method: 'GET',
      headers: {
        'X-Forwarded-For': '198.51.100.42, 10.0.0.1'
      }
    });

    assert(
      proxyResponse.statusCode === 200,
      'Request with X-Forwarded-For header succeeds with HTTP 200 (No ERR_ERL_UNEXPECTED_X_FORWARDED_FOR error)'
    );
    assert(
      proxyResponse.headers['ratelimit-remaining'] !== undefined,
      'Rate limit headers present and active with trusted proxy'
    );

    // Test authentication endpoint with X-Forwarded-For header
    const loginWithProxy = await doRequest(
      {
        path: '/api/auth/login',
        method: 'POST',
        headers: {
          'X-Forwarded-For': '198.51.100.42'
        }
      },
      {
        username: 'admin',
        password: 'admin1123'
      }
    );

    assert(
      loginWithProxy.statusCode === 200,
      'POST /api/auth/login succeeds behind proxy (HTTP 200)'
    );
    assert(
      typeof loginWithProxy.json?.data?.token === 'string',
      'Valid JWT token issued successfully behind proxy'
    );

    // Verify token can be decoded and has valid exp
    const token = loginWithProxy.json?.data?.token;
    const decoded = jwt.decode(token);
    assert(
      decoded && typeof decoded.exp === 'number' && decoded.exp > decoded.iat,
      'Token contains valid exp and iat timestamps'
    );
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }

  // ---------------------------------------------------------------------------
  // SUMMARY
  // ---------------------------------------------------------------------------
  console.log('\n================================================================');
  console.log(`  VERIFICATION RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests().catch((err) => {
  console.error('Fatal test execution error:', err);
  process.exit(1);
});

