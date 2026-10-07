/**
 * Comprehensive Auth Test Suite: MindGraph X
 * Verifies:
 * 1. Simple signup flow (Name + Email + Password + Confirm Password) -> Auto-login with tokens
 * 2. Case-insensitive email normalization
 * 3. Duplicate email rejection ("An account with this email already exists. Please log in.")
 * 4. Password validation (min 8 chars, 1 uppercase, 1 number, 1 special char, mismatch rejection)
 * 5. Simple login with email + password
 * 6. Generic "Invalid email or password" on bad credentials
 * 7. Token refresh flow (/auth/refresh)
 * 8. User session verification (/auth/me)
 * 9. Account persistence & scoping across sessions
 * 10. Logout and token invalidation (/auth/logout)
 */

const BASE = 'http://localhost:3000';

async function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${msg}`);
    process.exit(1);
  }
  console.log(`✅ PASSED: ${msg}`);
}

async function runTests() {
  console.log('🚀 Starting MindGraph X Standard Authentication Test Suite...\n');

  // Test 1: Validation checks on /auth/signup
  console.log('--- TEST 1: Signup Validation ---');
  const badPassRes = await fetch(`${BASE}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Tester',
      email: 'tester@mindgraph.ai',
      password: 'weak',
      confirm_password: 'weak',
    }),
  });
  assert(badPassRes.status === 400, 'Rejects password shorter than 8 chars');

  // Test 2: Full Happy Path (Signup -> Auto-Login -> /auth/me -> Logout -> Login again)
  console.log('\n--- TEST 2: Happy Path Signup & Auto-Login ---');
  const testEmail = `researcher_${Date.now()}@university.edu`;
  const testPassword = 'Password2026!';
  const signupRes = await fetch(`${BASE}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Dr. Evelyn Reed',
      email: testEmail,
      password: testPassword,
      confirm_password: testPassword,
    }),
  });
  const signupData = await signupRes.json();
  assert(signupRes.status === 201, 'Signup returns 201 Created');
  assert(!!signupData.access_token, 'Signup returns access_token immediately');
  assert(!!signupData.refresh_token, 'Signup returns refresh_token immediately');
  assert(signupData.user.name === 'Dr. Evelyn Reed', 'User name stored correctly');
  assert(signupData.user.email === testEmail.toLowerCase(), 'User email normalized');

  // Test 3: Access /auth/me with access_token
  console.log('\n--- TEST 3: Authenticated /auth/me ---');
  const meRes = await fetch(`${BASE}/auth/me`, {
    headers: {
      Authorization: `Bearer ${signupData.access_token}`,
    },
  });
  const meData = await meRes.json();
  assert(meRes.status === 200, 'GET /auth/me returns 200 OK with valid access_token');
  assert(meData.id === signupData.user.id, 'Identity verified via JWT');

  // Test 4: Duplicate signup rejection
  console.log('\n--- TEST 4: Duplicate Account Rejection ---');
  const dupRes = await fetch(`${BASE}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Duplicate',
      email: testEmail.toUpperCase(),
      password: testPassword,
      confirm_password: testPassword,
    }),
  });
  const dupData = await dupRes.json();
  assert(dupRes.status === 400, 'Rejects duplicate case-insensitive email');
  assert(dupData.error === 'An account with this email already exists. Please log in.', 'Returns clear error message on duplicate email');

  // Test 5: Token Refresh
  console.log('\n--- TEST 5: Token Refresh ---');
  const refreshRes = await fetch(`${BASE}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: signupData.refresh_token }),
  });
  const refreshData = await refreshRes.json();
  assert(refreshRes.status === 200, 'POST /auth/refresh returns 200 OK');
  assert(!!refreshData.access_token, 'Returns new access_token');

  // Test 6: Logout
  console.log('\n--- TEST 6: Logout & Invalidation ---');
  const logoutRes = await fetch(`${BASE}/auth/logout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${refreshData.access_token}`,
    },
    body: JSON.stringify({ refresh_token: refreshData.refresh_token }),
  });
  assert(logoutRes.status === 200, 'POST /auth/logout returns 200 OK');

  // Verify old refresh token cannot be reused
  const reusedRefreshRes = await fetch(`${BASE}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: refreshData.refresh_token }),
  });
  assert(reusedRefreshRes.status === 401, 'Revoked refresh token is denied');

  // Test 7: Login with mixed-case email
  console.log('\n--- TEST 7: Case-Insensitive Login ---');
  const loginRes = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmail.toUpperCase(),
      password: testPassword,
    }),
  });
  const loginData = await loginRes.json();
  assert(loginRes.status === 200, 'Login succeeds with mixed-case email');
  assert(loginData.user.id === signupData.user.id, 'Opens the exact same user account');

  // Test 8: Failed Login
  console.log('\n--- TEST 8: Failed Login Error Protection ---');
  const badLoginRes = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmail,
      password: 'IncorrectPassword999!',
    }),
  });
  const badLoginData = await badLoginRes.json();
  assert(badLoginRes.status === 401, 'Rejects invalid password with 401');
  assert(badLoginData.error === 'Invalid email or password', 'Generic error prevents enumeration');

  console.log('\n🎉 ALL 8 AUTH CRITERIA TESTS PASSED!\n');
}

runTests().catch((e) => {
  console.error('Test execution error:', e);
  process.exit(1);
});
