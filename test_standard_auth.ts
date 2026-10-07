/**
 * Automated Test: Standard Signup & Login Flow, Email Normalization,
 * OTP Removal Verification, and Data Persistence across Logouts
 */

const BASE = 'http://localhost:3000';

async function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${msg}`);
    process.exit(1);
  }
  console.log(`✅ PASSED: ${msg}`);
}

async function run() {
  console.log('🚀 Running Standard Auth, Persistence & OTP Removal Test Suite...\n');

  // ========================================================
  // PART 1: VERIFY OTP ENDPOINTS ARE COMPLETELY REMOVED (404)
  // ========================================================
  console.log('--- PART 1: Verify OTP Endpoints Removed ---');
  const otpReqRes = await fetch(`${BASE}/auth/request-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'test@example.com' }),
  });
  assert(otpReqRes.status === 404, 'POST /auth/request-otp is removed and returns 404');

  const otpVerRes = await fetch(`${BASE}/auth/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'test@example.com', otp: '123456' }),
  });
  assert(otpVerRes.status === 404, 'POST /auth/verify-otp is removed and returns 404');

  // ========================================================
  // PART 2: SIGNUP VALIDATION RULES
  // ========================================================
  console.log('\n--- PART 2: Signup Validation Rules ---');
  // Empty name
  const emptyNameRes = await fetch(`${BASE}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: '',
      email: 'valid@example.com',
      password: 'Password123!',
      confirm_password: 'Password123!',
    }),
  });
  assert(emptyNameRes.status === 400, 'Rejects empty name with 400');

  // Invalid email format
  const badEmailRes = await fetch(`${BASE}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Test User',
      email: 'not-an-email',
      password: 'Password123!',
      confirm_password: 'Password123!',
    }),
  });
  assert(badEmailRes.status === 400, 'Rejects invalid email with 400');

  // Password < 8 characters
  const shortPassRes = await fetch(`${BASE}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Test User',
      email: 'shortpass@example.com',
      password: 'Pass1!',
      confirm_password: 'Pass1!',
    }),
  });
  const shortPassData = await shortPassRes.json();
  assert(shortPassRes.status === 400, 'Rejects password < 8 chars with 400');
  assert(shortPassData.error.includes('8 characters'), 'Error specifies at least 8 characters');

  // Password missing uppercase
  const noUpperRes = await fetch(`${BASE}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Test User',
      email: 'noupper@example.com',
      password: 'password123!',
      confirm_password: 'password123!',
    }),
  });
  assert(noUpperRes.status === 400, 'Rejects password without uppercase letter');

  // Password missing number
  const noNumRes = await fetch(`${BASE}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Test User',
      email: 'nonum@example.com',
      password: 'Password!',
      confirm_password: 'Password!',
    }),
  });
  assert(noNumRes.status === 400, 'Rejects password without number');

  // Password missing special character
  const noSpecRes = await fetch(`${BASE}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Test User',
      email: 'nospec@example.com',
      password: 'Password123',
      confirm_password: 'Password123',
    }),
  });
  assert(noSpecRes.status === 400, 'Rejects password without special character');

  // Password mismatch
  const mismatchRes = await fetch(`${BASE}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Test User',
      email: 'mismatch@example.com',
      password: 'Password123!',
      confirm_password: 'Password456!',
    }),
  });
  assert(mismatchRes.status === 400, 'Rejects password mismatch with 400');

  // ========================================================
  // PART 3: SUCCESSFUL SIGNUP & EMAIL NORMALIZATION
  // ========================================================
  console.log('\n--- PART 3: Successful Signup & Normalization ---');
  const rawSignupEmail = `  Alex.Scholar_${Date.now()}@Gmail.COM  `;
  const normalizedEmail = rawSignupEmail.trim().toLowerCase();

  const signupRes = await fetch(`${BASE}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Alex Scholar',
      email: rawSignupEmail,
      password: 'SuperSecret123!',
      confirm_password: 'SuperSecret123!',
    }),
  });
  const signupData = await signupRes.json();
  assert(signupRes.status === 201, 'Signup succeeds with 201 Created');
  assert(!!signupData.access_token, 'Immediately returns access_token (no OTP required)');
  assert(!!signupData.refresh_token, 'Immediately returns refresh_token');
  assert(signupData.user.email === normalizedEmail, 'User email is properly normalized (trimmed and lowercased)');
  assert(signupData.user.name === 'Alex Scholar', 'User name is stored correctly');
  assert(signupData.user.email_verified === true, 'User is active immediately upon signup');

  // Attempt duplicate registration
  const dupRes = await fetch(`${BASE}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Duplicate Attempt',
      email: normalizedEmail,
      password: 'SuperSecret123!',
      confirm_password: 'SuperSecret123!',
    }),
  });
  const dupData = await dupRes.json();
  assert(dupRes.status === 400, 'Rejects duplicate registration');
  assert(dupData.error === 'An account with this email already exists. Please log in.', 'Returns exact required error message on duplicate email');

  // ========================================================
  // PART 4: LOGIN FLOW & CASE-INSENSITIVE RESOLUTION
  // ========================================================
  console.log('\n--- PART 4: Login Flow & Case-Insensitive Matching ---');
  // Login with uppercase / whitespace variation:
  const loginVariantEmail = `   ALEX.SCHOLAR_${rawSignupEmail.match(/\d+/)?.[0]}@GMAIL.COM   `;
  const loginRes = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: loginVariantEmail,
      password: 'SuperSecret123!',
    }),
  });
  const loginData = await loginRes.json();
  assert(loginRes.status === 200, 'Login succeeds with 200 OK regardless of case/spacing');
  assert(loginData.user.email === normalizedEmail, 'Resolves to the exact same normalized account');
  assert(!!loginData.access_token, 'Returns valid access token');

  // Invalid password -> generic error
  const wrongPassRes = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: normalizedEmail,
      password: 'WrongPassword999!',
    }),
  });
  const wrongPassData = await wrongPassRes.json();
  assert(wrongPassRes.status === 401, 'Rejects invalid password with 401');
  assert(wrongPassData.error === 'Invalid email or password', 'Returns generic "Invalid email or password" error');

  // ========================================================
  // PART 5: DATA PERSISTENCE ACROSS LOGOUT & NEW SESSION
  // ========================================================
  console.log('\n--- PART 5: Data Persistence & Scoped Workspace ---');
  const userToken = loginData.access_token;
  const userId = loginData.user.id;

  // 1. Upload a user-specific document under this session
  const docRes = await fetch(`${BASE}/documents/upload`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${userToken}`,
    },
    body: JSON.stringify({
      title: 'Quantum Hamiltonian Simulation',
      text: 'Quantum Hamiltonian Simulation utilizes Trotter-Suzuki decomposition to simulate physical dynamics.',
    }),
  });
  const docData = await docRes.json();
  assert(docRes.status === 200, 'Document ingested under user session');
  const createdDocId = docData.document.id;

  // 2. Perform Logout
  const logoutRes = await fetch(`${BASE}/auth/logout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${userToken}`,
    },
    body: JSON.stringify({ refresh_token: loginData.refresh_token }),
  });
  assert(logoutRes.status === 200, 'Logout succeeds with 200 OK');

  // 3. Simulate returning later (new browser session / fresh login)
  const returnLoginRes = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: normalizedEmail,
      password: 'SuperSecret123!',
    }),
  });
  const returnLoginData = await returnLoginRes.json();
  assert(returnLoginRes.status === 200, 'Return login succeeds with 200 OK');
  assert(returnLoginData.user.id === userId, 'Resolves to the exact same user_id');

  // 4. Verify user data is preserved and scoped
  const returnDocsRes = await fetch(`${BASE}/documents`, {
    headers: {
      Authorization: `Bearer ${returnLoginData.access_token}`,
    },
  });
  const returnDocsData = await returnDocsRes.json();
  const hasUserDoc = returnDocsData.documents.some((d: any) => d.id === createdDocId);
  assert(hasUserDoc, 'User data (documents and state) persists completely and is scoped by user_id');

  console.log('\n🎉 ALL STANDARD AUTH, PERSISTENCE & OTP REMOVAL TESTS PASSED!\n');
}

run().catch((e) => {
  console.error('Test execution error:', e);
  process.exit(1);
});
