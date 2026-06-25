/**
 * End-to-end API test for forgot / reset password flow.
 * Requires: backend running on API_BASE_URL (default http://localhost:5000)
 *           MONGODB_URI in backend/.env
 */
import '../src/config/loadEnv.js';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import connectMongo, { disconnectMongo } from '../src/config/mongo.js';
import Admin from '../src/models/Admin.js';
import { isSmtpConfigured } from '../src/config/smtp.js';

const API_BASE = (process.env.API_BASE_URL || 'http://localhost:5000').replace(/\/$/, '');
const ADMIN_EMAIL = 'admin@winswereldwinkel.nl';
const ORIGINAL_PASSWORD = 'Admin@123';
const TEMP_PASSWORD = 'TempPass@456';

let passed = 0;
let failed = 0;

const log = (label, ok, detail = '') => {
  const status = ok ? 'PASS' : 'FAIL';
  console.log(`[test-forgot-password] ${status} — ${label}${detail ? `: ${detail}` : ''}`);
  if (ok) passed += 1;
  else failed += 1;
};

const apiPost = async (path, body) => {
  const response = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await response.json().catch(() => ({}));
  return { status: response.status, data };
};

const seedResetToken = async (rawToken, expiresAt) => {
  const admin = await Admin.findOne({ email: ADMIN_EMAIL });
  if (!admin) {
    throw new Error(`Admin account not found: ${ADMIN_EMAIL}`);
  }
  const tokenHash = await bcrypt.hash(rawToken, 10);
  await Admin.findByIdAndUpdate(admin._id, {
    passwordResetToken: tokenHash,
    passwordResetExpires: expiresAt,
  });
  return admin._id;
};

const clearAdminResetToken = async () => {
  const admin = await Admin.findOne({ email: ADMIN_EMAIL });
  if (admin) {
    await Admin.findByIdAndUpdate(admin._id, {
      passwordResetToken: null,
      passwordResetExpires: null,
    });
  }
};

const restoreAdminPassword = async (password) => {
  const admin = await Admin.findOne({ email: ADMIN_EMAIL }).select('+password');
  if (!admin) return;
  admin.password = password;
  await admin.save();
};

const run = async () => {
  console.log(`[test-forgot-password] API base: ${API_BASE}`);
  console.log(`[test-forgot-password] SMTP configured: ${isSmtpConfigured()}`);

  try {
    await connectMongo();
  } catch (error) {
    console.error(`[test-forgot-password] MongoDB connection failed: ${error.message}`);
    process.exit(1);
  }

  try {
    // 1. Invalid email
    const invalidEmail = await apiPost('/api/auth/forgot-password', {
      email: 'not-a-real-user@example.com',
    });
    log(
      'Invalid email returns 404',
      invalidEmail.status === 404 &&
        invalidEmail.data.message?.includes('Invalid email address'),
      `status=${invalidEmail.status} message=${invalidEmail.data.message}`
    );

    // 2. Invalid token validation
    const invalidToken = await apiPost('/api/auth/validate-reset-token', {
      email: ADMIN_EMAIL,
      token: 'invalid-token-value',
    });
    log(
      'Invalid token returns 400',
      invalidToken.status === 400 &&
        invalidToken.data.message?.toLowerCase().includes('invalid reset token'),
      `status=${invalidToken.status} message=${invalidToken.data.message}`
    );

    // 3. Valid token — validate + reset + clear
    const rawToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
    await seedResetToken(rawToken, expiresAt);

    const validToken = await apiPost('/api/auth/validate-reset-token', {
      email: ADMIN_EMAIL,
      token: rawToken,
    });
    log(
      'Valid token passes validation',
      validToken.status === 200 && validToken.data.valid === true,
      `status=${validToken.status}`
    );

    const resetResult = await apiPost('/api/auth/reset-password', {
      email: ADMIN_EMAIL,
      token: rawToken,
      newPassword: TEMP_PASSWORD,
      confirmPassword: TEMP_PASSWORD,
    });
    log(
      'Password reset succeeds',
      resetResult.status === 200 && resetResult.data.success === true,
      `status=${resetResult.status} message=${resetResult.data.message}`
    );

    const adminAfterReset = await Admin.findOne({ email: ADMIN_EMAIL }).select('+passwordResetToken');
    log(
      'Reset token cleared from database',
      !adminAfterReset?.passwordResetToken && !adminAfterReset?.passwordResetExpires,
      `token=${adminAfterReset?.passwordResetToken ? 'present' : 'cleared'}`
    );

    const loginAfterReset = await apiPost('/api/auth/login', {
      email: ADMIN_EMAIL,
      password: TEMP_PASSWORD,
    });
    log(
      'Login works with new password',
      loginAfterReset.status === 200 && loginAfterReset.data.success === true,
      `status=${loginAfterReset.status}`
    );

    // 4. Reused token should fail
    const reusedToken = await apiPost('/api/auth/reset-password', {
      email: ADMIN_EMAIL,
      token: rawToken,
      newPassword: 'AnotherPass@789',
      confirmPassword: 'AnotherPass@789',
    });
    log(
      'Reused token rejected',
      reusedToken.status === 400,
      `status=${reusedToken.status} message=${reusedToken.data.message}`
    );

    // 5. Expired token
    const expiredRaw = crypto.randomBytes(32).toString('hex');
    await seedResetToken(expiredRaw, new Date(Date.now() - 1000));

    const expiredValidate = await apiPost('/api/auth/validate-reset-token', {
      email: ADMIN_EMAIL,
      token: expiredRaw,
    });
    log(
      'Expired token returns 410',
      expiredValidate.status === 410 &&
        expiredValidate.data.message?.toLowerCase().includes('expired'),
      `status=${expiredValidate.status} message=${expiredValidate.data.message}`
    );

    await clearAdminResetToken();

    // 6. Forgot-password SMTP behaviour
    const forgotResult = await apiPost('/api/auth/forgot-password', { email: ADMIN_EMAIL });
    if (!isSmtpConfigured()) {
      log(
        'SMTP not configured returns 500 with missing vars',
        forgotResult.status === 500 &&
          forgotResult.data.message?.includes('SMTP_USER') &&
          forgotResult.data.message?.includes('SMTP_PASS'),
        `status=${forgotResult.status} message=${forgotResult.data.message}`
      );
    } else {
      log(
        'Forgot-password sends email when SMTP configured',
        forgotResult.status === 200 && forgotResult.data.success === true,
        `status=${forgotResult.status} message=${forgotResult.data.message}`
      );
      log(
        'Success message does not say "not configured"',
        !forgotResult.data.message?.includes('not configured'),
        forgotResult.data.message
      );
    }

    await restoreAdminPassword(ORIGINAL_PASSWORD);
    const loginRestored = await apiPost('/api/auth/login', {
      email: ADMIN_EMAIL,
      password: ORIGINAL_PASSWORD,
    });
    log(
      'Admin password restored for seed account',
      loginRestored.status === 200,
      `status=${loginRestored.status}`
    );
  } catch (error) {
    console.error(`[test-forgot-password] Unexpected error: ${error.message}`);
    if (error.stack) console.error(error.stack);
    failed += 1;
  } finally {
    await clearAdminResetToken();
    await disconnectMongo();
  }

  console.log(`\n[test-forgot-password] Results: ${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
};

run();
