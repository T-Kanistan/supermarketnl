import crypto from 'crypto';
import bcrypt from 'bcrypt';
import Admin from '../models/Admin.js';
import ManagerAccount from '../models/ManagerAccount.js';
import User from '../models/User.js';
import Manager from '../models/Manager.js';
import { signToken } from '../utils/jwt.js';
import { MANAGER_PERMISSIONS } from '../constants/managerPermissions.js';
import * as managerService from './managerService.js';
import { sendPasswordResetEmail } from './emailService.js';
import { getSmtpConfigurationError, isSmtpConfigured, logSmtpRuntimeDiagnostics } from '../config/smtp.js';
import { validatePasswordStrength } from '../utils/passwordPolicy.js';

const RESET_TOKEN_EXPIRY_MS = 60 * 60 * 1000; // 1 hour

const persistResetToken = async (accountModel, accountId, tokenHash, expiresAt) => {
  const updates = { passwordResetToken: tokenHash, passwordResetExpires: expiresAt };

  switch (accountModel) {
    case 'Admin':
      await Admin.findByIdAndUpdate(accountId, updates);
      break;
    case 'ManagerAccount':
      await ManagerAccount.findByIdAndUpdate(accountId, updates);
      break;
    case 'User':
      await User.findByIdAndUpdate(accountId, updates);
      break;
    case 'Manager':
      await Manager.findByIdAndUpdate(accountId, updates);
      break;
    default:
      throw new Error(`Unknown account model: ${accountModel}`);
  }
};

const clearResetToken = async (accountModel, accountId) => {
  const updates = { passwordResetToken: null, passwordResetExpires: null };

  switch (accountModel) {
    case 'Admin':
      await Admin.findByIdAndUpdate(accountId, updates);
      break;
    case 'ManagerAccount':
      await ManagerAccount.findByIdAndUpdate(accountId, updates);
      break;
    case 'User':
      await User.findByIdAndUpdate(accountId, updates);
      break;
    case 'Manager':
      await Manager.findByIdAndUpdate(accountId, updates);
      break;
    default:
      break;
  }
};

const loadAccountWithResetFields = async (accountModel, accountId) => {
  switch (accountModel) {
    case 'Admin':
      return Admin.findById(accountId).select('+passwordResetToken');
    case 'ManagerAccount':
      return ManagerAccount.findById(accountId).select('+passwordResetToken');
    case 'User':
      return User.findById(accountId).select('+passwordResetToken');
    case 'Manager':
      return Manager.findById(accountId).select('+passwordResetToken');
    default:
      return null;
  }
};

export const formatAuthUser = (account, role) => ({
  id: account._id.toString(),
  name: account.name || account.fullName,
  fullName: account.name || account.fullName,
  email: account.email,
  role,
  isActive: account.isActive ?? account.status ?? true,
});

const buildTokenPayload = (account, accountSource, role) => ({
  id: account._id,
  role,
  accountType: role,
  accountSource,
});

const issueAuthResponse = (account, accountSource, role) => {
  const token = signToken(buildTokenPayload(account, accountSource, role));
  const user = formatAuthUser(account, role);

  return {
    success: true,
    message: 'Login successful',
    token,
    role,
    permissions: role === 'admin' ? ['*'] : MANAGER_PERMISSIONS,
    user,
  };
};

const tryAdminLogin = async (email, password) => {
  const admin = await Admin.findOne({ email }).select('+password');
  if (!admin) return null;

  const isMatch = await admin.comparePassword(password);
  if (!isMatch) return { error: 'INVALID_CREDENTIALS' };

  if (!admin.isActive) {
    return { error: 'INACTIVE', message: 'Account inactive. Please contact the administrator.' };
  }

  admin.lastLogin = new Date();
  await admin.save({ validateBeforeSave: false });

  return issueAuthResponse(admin, 'admin', 'admin');
};

const tryManagerAccountLogin = async (email, password) => {
  const manager = await ManagerAccount.findOne({ email }).select('+password');
  if (!manager) return null;

  const isMatch = await manager.comparePassword(password);
  if (!isMatch) return { error: 'INVALID_CREDENTIALS' };

  if (!manager.isActive) {
    return { error: 'INACTIVE', message: 'Account inactive. Please contact the administrator.' };
  }

  manager.lastLogin = new Date();
  await manager.save({ validateBeforeSave: false });

  return issueAuthResponse(manager, 'manager', 'manager');
};

const tryLegacyUserLogin = async (email, password) => {
  const user = await User.findOne({ email });
  if (!user) return null;

  const isMatch = await user.comparePassword(password);
  if (!isMatch) return { error: 'INVALID_CREDENTIALS' };

  if (!user.isActive || user.accountStatus === 'Inactive' || user.accountStatus === 'Suspended') {
    return { error: 'INACTIVE', message: 'Account inactive. Please contact the administrator.' };
  }

  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  const role = user.role === 'admin' ? 'admin' : 'manager';
  return issueAuthResponse(user, 'user', role);
};

const tryLegacyManagerLogin = async (email, password) => {
  const manager = await managerService.findManagerForLogin(email);
  if (!manager) return null;

  if (!manager.status) {
    return { error: 'INACTIVE', message: 'Account inactive. Please contact the administrator.' };
  }

  const isMatch = await manager.comparePassword(password);
  if (!isMatch) return { error: 'INVALID_CREDENTIALS' };

  manager.lastLogin = new Date();
  await manager.save({ validateBeforeSave: false });

  const normalized = {
    _id: manager._id,
    name: manager.fullName,
    fullName: manager.fullName,
    email: manager.email,
    isActive: manager.status,
  };

  return issueAuthResponse(normalized, 'legacy_manager', 'manager');
};

export const loginWithEmailPassword = async (email, password) => {
  const loginValue = String(email || '').trim().toLowerCase();

  if (!loginValue || !password) {
    const error = new Error('Email and password are required');
    error.statusCode = 400;
    throw error;
  }

  const attempts = [
    tryAdminLogin,
    tryManagerAccountLogin,
    tryLegacyUserLogin,
    tryLegacyManagerLogin,
  ];

  let invalidCredentials = false;

  for (const attempt of attempts) {
    const result = await attempt(loginValue, password);
    if (!result) continue;
    if (result.error === 'INVALID_CREDENTIALS') {
      invalidCredentials = true;
      continue;
    }
    if (result.error === 'INACTIVE') {
      const error = new Error(result.message);
      error.statusCode = 403;
      throw error;
    }
    return result;
  }

  if (invalidCredentials) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }

  const error = new Error('Invalid email or password');
  error.statusCode = 401;
  throw error;
};

const findAccountForPasswordReset = async (email) => {
  const admin = await Admin.findOne({ email, isActive: true });
  if (admin) {
    return {
      account: admin,
      accountType: 'admin',
      accountId: admin._id,
      accountModel: 'Admin',
    };
  }

  const manager = await ManagerAccount.findOne({ email, isActive: true });
  if (manager) {
    return {
      account: manager,
      accountType: 'manager',
      accountId: manager._id,
      accountModel: 'ManagerAccount',
    };
  }

  const user = await User.findOne({ email, isActive: true });
  if (user) {
    return {
      account: user,
      accountType: user.role === 'admin' ? 'admin' : 'manager',
      accountId: user._id,
      accountModel: 'User',
    };
  }

  const legacyManager = await managerService.findManagerForLogin(email);
  if (legacyManager?.status) {
    return {
      account: legacyManager,
      accountType: 'manager',
      accountId: legacyManager._id,
      accountModel: 'Manager',
    };
  }

  return null;
};

const verifyResetTokenOnAccount = async (accountModel, accountId, rawToken) => {
  const account = await loadAccountWithResetFields(accountModel, accountId);

  if (!account?.passwordResetToken) {
    return { valid: false, reason: 'invalid', message: 'Invalid reset token. Please request a new password reset link.' };
  }

  if (!account.passwordResetExpires || account.passwordResetExpires <= new Date()) {
    await clearResetToken(accountModel, accountId);
    return {
      valid: false,
      reason: 'expired',
      message: 'This password reset link has expired. Please request a new one.',
    };
  }

  const tokenMatches = await bcrypt.compare(rawToken, account.passwordResetToken);
  if (!tokenMatches) {
    return { valid: false, reason: 'invalid', message: 'Invalid reset token. Please request a new password reset link.' };
  }

  return { valid: true, account };
};

export const requestPasswordReset = async (email) => {
  const normalizedEmail = String(email || '').trim().toLowerCase();

  if (!normalizedEmail) {
    const error = new Error('Email is required');
    error.statusCode = 400;
    throw error;
  }

  const accountInfo = await findAccountForPasswordReset(normalizedEmail);

  if (!accountInfo) {
    const error = new Error('Invalid email address. No account found with this email.');
    error.statusCode = 404;
    throw error;
  }

  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = await bcrypt.hash(rawToken, 10);
  const expiresAt = new Date(Date.now() + RESET_TOKEN_EXPIRY_MS);

  await persistResetToken(accountInfo.accountModel, accountInfo.accountId, tokenHash, expiresAt);
  console.log(
    `[auth] Password reset token saved for ${normalizedEmail} (expires ${expiresAt.toISOString()})`
  );

  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const resetUrl = `${frontendUrl}/reset-password?token=${rawToken}&email=${encodeURIComponent(normalizedEmail)}`;

  const emailResult = await sendPasswordResetEmail({
    to: normalizedEmail,
    resetUrl,
  });

  if (!emailResult.sent) {
    await clearResetToken(accountInfo.accountModel, accountInfo.accountId);

    logSmtpRuntimeDiagnostics('forgot-password');

    if (process.env.NODE_ENV !== 'production') {
      console.warn('[auth] Password reset email not sent. Reset URL for testing:');
      console.warn(resetUrl);
    }

    let errorMessage = 'Password reset email could not be sent. Please try again later.';

    if (!isSmtpConfigured() || emailResult.missingVars?.length) {
      const missing = emailResult.missingVars?.length
        ? emailResult.missingVars
        : getSmtpConfigurationError()?.missingVars || [];
      errorMessage =
        getSmtpConfigurationError()?.message ||
        `Password reset email could not be sent. Set ${missing.join(', ')} in backend/.env and restart the server.`;
      console.error(`[auth] SMTP not configured for forgot-password. Missing: ${missing.join(', ')}`);
    } else if (emailResult.error) {
      errorMessage = `Password reset email could not be sent: ${emailResult.error}`;
      console.error(`[auth] SMTP send failed for ${normalizedEmail}: ${emailResult.error}`);
    }

    const error = new Error(errorMessage);
    error.statusCode = 500;
    throw error;
  }

  console.log(`[auth] Password reset email sent successfully to ${normalizedEmail}`);

  return {
    success: true,
    message: 'Password reset link has been sent to your email.',
  };
};

const updateAccountPassword = async (accountType, accountId, newPassword) => {
  if (accountType === 'admin') {
    const admin = await Admin.findById(accountId).select('+password');
    if (admin) {
      admin.password = newPassword;
      await admin.save();
      return true;
    }
    const user = await User.findById(accountId);
    if (user && user.role === 'admin') {
      user.password = newPassword;
      await user.save();
      return true;
    }
    return false;
  }

  const manager = await ManagerAccount.findById(accountId).select('+password');
  if (manager) {
    manager.password = newPassword;
    await manager.save();
    return true;
  }

  const user = await User.findById(accountId);
  if (user) {
    user.password = newPassword;
    await user.save();
    return true;
  }

  const legacyManager = await Manager.findById(accountId);
  if (legacyManager) {
    legacyManager.passwordHash = await Manager.hashPassword(newPassword);
    await legacyManager.save();
    return true;
  }

  return false;
};

export const validatePasswordResetToken = async ({ email, token }) => {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const rawToken = String(token || '').trim();

  if (!normalizedEmail || !rawToken) {
    const error = new Error('Email and reset token are required');
    error.statusCode = 400;
    throw error;
  }

  const accountInfo = await findAccountForPasswordReset(normalizedEmail);
  if (!accountInfo) {
    const error = new Error('Invalid email address. No account found with this email.');
    error.statusCode = 404;
    throw error;
  }

  const verification = await verifyResetTokenOnAccount(
    accountInfo.accountModel,
    accountInfo.accountId,
    rawToken
  );

  if (!verification.valid) {
    const error = new Error(verification.message);
    error.statusCode = verification.reason === 'expired' ? 410 : 400;
    throw error;
  }

  return { success: true, valid: true, message: 'Reset token is valid.' };
};

export const resetPasswordWithToken = async ({ email, token, newPassword, confirmPassword }) => {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const rawToken = String(token || '').trim();

  if (!normalizedEmail || !rawToken || !newPassword) {
    const error = new Error('Email, token, and new password are required');
    error.statusCode = 400;
    throw error;
  }

  if (confirmPassword !== undefined && newPassword !== confirmPassword) {
    const error = new Error('Passwords do not match');
    error.statusCode = 400;
    throw error;
  }

  const passwordCheck = validatePasswordStrength(newPassword);
  if (!passwordCheck.valid) {
    const error = new Error(passwordCheck.message);
    error.statusCode = 400;
    throw error;
  }

  const accountInfo = await findAccountForPasswordReset(normalizedEmail);
  if (!accountInfo) {
    const error = new Error('Invalid email address. No account found with this email.');
    error.statusCode = 404;
    throw error;
  }

  const verification = await verifyResetTokenOnAccount(
    accountInfo.accountModel,
    accountInfo.accountId,
    rawToken
  );

  if (!verification.valid) {
    const error = new Error(verification.message);
    error.statusCode = verification.reason === 'expired' ? 410 : 400;
    throw error;
  }

  const updated = await updateAccountPassword(
    accountInfo.accountType,
    accountInfo.accountId,
    newPassword
  );

  if (!updated) {
    const error = new Error('Unable to reset password for this account');
    error.statusCode = 400;
    throw error;
  }

  await clearResetToken(accountInfo.accountModel, accountInfo.accountId);
  console.log(`[auth] Password reset completed and token cleared for ${normalizedEmail}`);

  return {
    success: true,
    message: 'Password reset successfully. Please login with your new password.',
  };
};

export const resolveAccountFromToken = async (decoded) => {
  const { id, accountSource, role, accountType } = decoded;
  const source = accountSource || (accountType === 'manager' ? 'manager' : 'admin');

  if (source === 'admin') {
    const admin = await Admin.findById(id).select('-password');
    if (admin) {
      if (!admin.isActive) throw Object.assign(new Error('Account inactive'), { statusCode: 403 });
      return {
        ...admin.toObject(),
        id: admin._id.toString(),
        role: 'admin',
        accountType: 'admin',
        accountSource: 'admin',
        permissions: ['*'],
      };
    }
  }

  if (source === 'manager') {
    const manager = await ManagerAccount.findById(id).select('-password');
    if (manager) {
      if (!manager.isActive) throw Object.assign(new Error('Account inactive'), { statusCode: 403 });
      return {
        ...manager.toObject(),
        name: manager.name,
        fullName: manager.name,
        role: 'manager',
        accountType: 'manager',
        accountSource: 'manager',
        permissions: MANAGER_PERMISSIONS,
      };
    }
  }

  if (source === 'legacy_manager' || role === 'manager') {
    const legacyManager = await Manager.findById(id);
    if (legacyManager) {
      if (!legacyManager.status) throw Object.assign(new Error('Account inactive'), { statusCode: 403 });
      return {
        _id: legacyManager._id,
        id: legacyManager._id.toString(),
        name: legacyManager.fullName,
        fullName: legacyManager.fullName,
        email: legacyManager.email,
        role: 'manager',
        accountType: 'manager',
        accountSource: 'legacy_manager',
        permissions: MANAGER_PERMISSIONS,
      };
    }
  }

  const user = await User.findById(id).select('-password');
  if (user) {
    if (!user.isActive) throw Object.assign(new Error('Account inactive'), { statusCode: 403 });
    return {
      ...user.toObject(),
      id: user._id.toString(),
      accountType: user.role === 'admin' ? 'admin' : 'manager',
      accountSource: 'user',
      permissions: user.role === 'admin' ? ['*'] : MANAGER_PERMISSIONS,
    };
  }

  return null;
};
