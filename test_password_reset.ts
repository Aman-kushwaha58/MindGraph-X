/**
 * Automated Test: Password Reset Email Link Flow
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
  console.log('🚀 Running Password Reset Email Link Flow Test Suite...\n');

  // Test 1: Validation on /auth/forgot-password
  console.log('--- TEST 1: Request Reset Validation ---');
  const badEmailRes = await fetch(`${BASE}/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'not-an-email' }),
  });
  assert(badEmailRes.status === 400, 'Rejects invalid email format on /auth/forgot-password');

  // Test 2: User Enumeration Protection
  console.log('\n--- TEST 2: Enumeration Prevention ---');
  const nonExistentRes = await fetch(`${BASE}/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'ghost_user_does_not_exist@example.com' }),
  });
  const nonExistentData = await nonExistentRes.json();
  assert(nonExistentRes.status === 200, 'Returns 200 OK for non-existent email to prevent enumeration');
  assert(nonExistentData.message.includes('If an account exists'), 'Returns generic privacy message');
  assert(nonExistentData.reset_token === undefined, 'Does not generate a token for non-existent accounts');

  // Test 3: Create User Account for Reset Test
  console.log('\n--- TEST 3: Create Account ---');
  const testEmail = `ResetTester_${Date.now()}@Research.EDU`;
  const initialPassword = 'InitialPassword123!';
  const signupRes = await fetch(`${BASE}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Reset Test User',
      email: testEmail,
      password: initialPassword,
      confirm_password: initialPassword,
    }),
  });
  assert(signupRes.status === 201, 'Signup succeeds for test account');

  // Test 4: Request Password Reset Link
  console.log('\n--- TEST 4: Request Password Reset Link ---');
  const forgotRes = await fetch(`${BASE}/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testEmail.toLowerCase() }),
  });
  const forgotData = await forgotRes.json();
  assert(forgotRes.status === 200, 'POST /auth/forgot-password returns 200 OK');
  assert(!!forgotData.reset_token, 'Generated secure reset token in response');
  assert(forgotData.reset_url?.includes('reset_token='), 'Generates valid reset link URL');
  const resetToken = forgotData.reset_token;

  // Test 5: Verify Reset Token
  console.log('\n--- TEST 5: Verify Reset Token ---');
  const invalidVerifyRes = await fetch(`${BASE}/auth/verify-reset-token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: 'bogus-token-12345' }),
  });
  assert(invalidVerifyRes.status === 400, 'Rejects invalid reset token');

  const validVerifyRes = await fetch(`${BASE}/auth/verify-reset-token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: resetToken }),
  });
  const validVerifyData = await validVerifyRes.json();
  assert(validVerifyRes.status === 200, 'POST /auth/verify-reset-token verifies token');
  assert(validVerifyData.valid === true, 'Token is marked as valid');
  assert(validVerifyData.email === testEmail.toLowerCase(), 'Resolves to user email');

  // Test 6: Validation during Password Reset
  console.log('\n--- TEST 6: Reset Password Validation ---');
  // Short password
  const shortRes = await fetch(`${BASE}/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      token: resetToken,
      password: 'short',
      confirm_password: 'short',
    }),
  });
  assert(shortRes.status === 400, 'Rejects password shorter than 8 characters');

  // Password mismatch
  const mismatchRes = await fetch(`${BASE}/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      token: resetToken,
      password: 'NewStrongPassword123!',
      confirm_password: 'DifferentPassword456!',
    }),
  });
  assert(mismatchRes.status === 400, 'Rejects password mismatch');

  // Test 7: Complete Password Reset
  console.log('\n--- TEST 7: Complete Password Reset ---');
  const newPassword = 'BrandNewStrongPassword2026!';
  const resetRes = await fetch(`${BASE}/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      token: resetToken,
      password: newPassword,
      confirm_password: newPassword,
    }),
  });
  const resetData = await resetRes.json();
  assert(resetRes.status === 200, 'POST /auth/reset-password returns 200 OK');
  assert(resetData.success === true, 'Password update marked as success');

  // Test 8: Single-Use Token Invalidation
  console.log('\n--- TEST 8: Single-Use Token Protection ---');
  const reuseRes = await fetch(`${BASE}/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      token: resetToken,
      password: 'AnotherPassword999!',
      confirm_password: 'AnotherPassword999!',
    }),
  });
  const reuseData = await reuseRes.json();
  assert(reuseRes.status === 400, 'Rejects reusing an already-used reset token');
  assert(reuseData.error.includes('already been used'), 'Error confirms token was already consumed');

  // Test 9: Verify Old Password Rejected
  console.log('\n--- TEST 9: Old Password Invalidation ---');
  const oldLoginRes = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmail,
      password: initialPassword,
    }),
  });
  assert(oldLoginRes.status === 401, 'Old password fails to login');

  // Test 10: Verify New Password Works
  console.log('\n--- TEST 10: New Password Login ---');
  const newLoginRes = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmail,
      password: newPassword,
    }),
  });
  const newLoginData = await newLoginRes.json();
  assert(newLoginRes.status === 200, 'Login succeeds with new password');
  assert(!!newLoginData.access_token, 'Returns new access token');
  assert(newLoginData.user.email === testEmail.toLowerCase(), 'Accesses the correct account');

  console.log('\n🎉 ALL PASSWORD RESET TESTS PASSED!\n');
}

run().catch((e) => {
  console.error('Test execution error:', e);
  process.exit(1);
});
