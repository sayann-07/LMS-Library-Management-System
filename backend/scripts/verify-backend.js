const http = require('http');
const { spawn } = require('child_process');
const path = require('path');

function request(method, urlPath, port, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const postData = body ? JSON.stringify(body) : null;
    const headers = {
      'Content-Type': 'application/json'
    };
    if (postData) {
      headers['Content-Length'] = Buffer.byteLength(postData);
    }
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const options = {
      hostname: 'localhost',
      port: port,
      path: urlPath,
      method: method,
      headers: headers
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });

    req.on('error', (err) => reject(err));
    if (postData) req.write(postData);
    req.end();
  });
}

async function runVerification() {
  console.log('====================================================');
  console.log('   Full End-to-End System & API Verification Suite   ');
  console.log('====================================================\n');

  const testPort = 5002;
  console.log(`[Boot] Spawning backend instance on port ${testPort}...`);
  const serverProcess = spawn('node', ['server.js'], {
    cwd: path.resolve(__dirname, '..'),
    stdio: 'pipe',
    env: { ...process.env, PORT: String(testPort) }
  });

  let serverOutput = '';
  serverProcess.stdout.on('data', (d) => (serverOutput += d.toString()));
  serverProcess.stderr.on('data', (d) => (serverOutput += d.toString()));

  // Wait 2.5s for database pool and HTTP server to listen
  await new Promise((resolve) => setTimeout(resolve, 2500));

  const testResults = [];

  try {
    // 1. Health Check
    console.log('[Test 1/7] Testing GET /api/health...');
    const health = await request('GET', '/api/health', testPort);
    const healthPass = health.status === 200 && health.body?.database === 'connected';
    testResults.push({ name: 'System Health & MySQL Connection', pass: healthPass });
    console.log(`  -> Status: ${health.status} | DB: ${health.body?.database}`);

    // 2. Authentication: Valid Login
    console.log('\n[Test 2/7] Testing POST /api/auth/login (admin / admin1123)...');
    const authSuccess = await request('POST', '/api/auth/login', testPort, {
      username: 'admin',
      password: 'admin1123'
    });
    const token = authSuccess.body?.data?.token;
    const loginPass = authSuccess.status === 200 && Boolean(token);
    testResults.push({ name: 'Admin Authentication (JWT)', pass: loginPass });
    console.log(`  -> Status: ${authSuccess.status} | Token Generated: ${Boolean(token)}`);

    // 3. Authentication: Invalid Login Rejection
    console.log('\n[Test 3/7] Testing POST /api/auth/login (Invalid Password Rejection)...');
    const authFail = await request('POST', '/api/auth/login', testPort, {
      username: 'admin',
      password: 'wrong_password_999'
    });
    const rejectPass = authFail.status === 401;
    testResults.push({ name: 'Brute-Force & Credential Security', pass: rejectPass });
    console.log(`  -> Status: ${authFail.status} (Rejected as expected: ${rejectPass})`);

    // 4. Books Catalog Fetch
    console.log('\n[Test 4/7] Testing GET /api/books...');
    const books = await request('GET', '/api/books', testPort);
    const booksPass = books.status === 200 && Array.isArray(books.body?.data);
    testResults.push({ name: 'Books Catalog Read API', pass: booksPass });
    console.log(`  -> Status: ${books.status} | Total Books: ${books.body?.data?.length}`);

    // 5. Members Directory Fetch (Protected with Bearer Token)
    console.log('\n[Test 5/7] Testing GET /api/members (Authenticated)...');
    const members = await request('GET', '/api/members', testPort, null, token);
    const membersPass = members.status === 200 && Array.isArray(members.body?.data);
    testResults.push({ name: 'Members Directory Read API', pass: membersPass });
    console.log(`  -> Status: ${members.status} | Total Members: ${members.body?.data?.length}`);

    // 6. Transactions Log Fetch (Protected with Bearer Token)
    console.log('\n[Test 6/7] Testing GET /api/transactions (Authenticated)...');
    const tx = await request('GET', '/api/transactions', testPort, null, token);
    const txPass = tx.status === 200 && Array.isArray(tx.body?.data);
    testResults.push({ name: 'Circulation Transactions Read API', pass: txPass });
    console.log(`  -> Status: ${tx.status} | Total Records: ${tx.body?.data?.length}`);

    // 7. Protected Route Authorization Check
    console.log('\n[Test 7/7] Testing GET /api/auth/profile with Bearer Token...');
    const profile = await request('GET', '/api/auth/profile', testPort, null, token);
    const profilePass = profile.status === 200 && profile.body?.data?.username === 'admin';
    testResults.push({ name: 'Protected Route Authorization', pass: profilePass });
    console.log(`  -> Status: ${profile.status} | Authenticated User: ${profile.body?.data?.username}`);

    console.log('\n====================================================');
    console.log('                 TEST SUMMARY REPORT                ');
    console.log('====================================================');
    let allPassed = true;
    testResults.forEach((t) => {
      console.log(`  [${t.pass ? 'PASS' : 'FAIL'}] ${t.name}`);
      if (!t.pass) allPassed = false;
    });
    console.log('====================================================');
    console.log(`OVERALL RESULT: ${allPassed ? 'ALL TESTS PASSED (100%)' : 'SOME TESTS FAILED'}`);
    console.log('====================================================\n');
  } catch (err) {
    console.error('Test execution failed with error:', err.message);
  } finally {
    serverProcess.kill('SIGINT');
  }
}

runVerification();
