import crypto from 'crypto';
import bcrypt from 'bcrypt';
import Admin from '../models/Admin.js';
import ManagerAccount from '../models/ManagerAccount.js';
import User from '../models/User.js';
import Manager from '../models/Manager.js';
import PasswordResetToken from '../models/PasswordResetToken.js';
import { signToken } from '../utils/jwt.js';
import { MANAGER_PERMISSIONS } from '../constants/managerPermissions.js';
import * as managerService from './managerService.js';
import { sendPasswordResetEmail } from './emailService.js';

const RESET_TOKEN_EXPIRY_MS = 60 * 60 * 1000; // 1 hour

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
    return { account: admin, accountType: 'admin', accountId: admin._id };
  }

  const manager = await ManagerAccount.findOne({ email, isActive: true });
  if (manager) {
    return { account: manager, accountType: 'manager', accountId: manager._id };
  }

  const user = await User.findOne({ email, isActive: true });
  if (user) {
    return {
      account: user,
      accountType: user.role === 'admin' ? 'admin' : 'manager',
      accountId: user._id,
    };
  }

  const legacyManager = await managerService.findManagerForLogin(email);
  if (legacyManager?.status) {
    return { account: legacyManager, accountType: 'manager', accountId: legacyManager._id };
  }

  return null;
};

export const requestPasswordReset = async (email) => {
  const normalizedEmail = String(email || '').trim().toLowerCase();

  if (!normalizedEmail) {
    const error = new Error('Email is required');
    error.statusCode = 400;
    throw error;
  }

  const accountInfo = await findAccountForPasswordReset(normalizedEmail);

  if (accountInfo) {
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = await bcrypt.hash(rawToken, 10);
    const expiresAt = new Date(Date.now() + RESET_TOKEN_EXPIRY_MS);

    await PasswordResetToken.deleteMany({ email: normalizedEmail, usedAt: null });

    await PasswordResetToken.create({
      email: normalizedEmail,
      tokenHash,
      accountType: accountInfo.accountType,
      accountId: accountInfo.accountId,
      expiresAt,
    });

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetUrl = `${frontendUrl}/reset-password?token=${rawToken}&email=${encodeURIComponent(normalizedEmail)}`;

    await sendPasswordResetEmail({
      to: normalizedEmail,
      name: accountInfo.account.name || accountInfo.account.fullName || 'User',
      resetUrl,
    }).catch((emailError) => {
      console.error(`[auth] Password reset email failed: ${emailError.message}`);
    });
  }

  return {
    success: true,
    message: 'If an account exists for this email, a password reset link has been sent.',
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

export const resetPasswordWithToken = async ({ email, token, newPassword }) => {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const rawToken = String(token || '').trim();

  if (!normalizedEmail || !rawToken || !newPassword) {
    const error = new Error('Email, token, and new password are required');
    error.statusCode = 400;
    throw error;
  }

  if (newPassword.length < 6) {
    const error = new Error('Password must be at least 6 characters long');
    error.statusCode = 400;
    throw error;
  }

  const resetRecord = await PasswordResetToken.findOne({
    email: normalizedEmail,
    usedAt: null,
    expiresAt: { $gt: new Date() },
  }).sort({ createdAt: -1 });

  if (!resetRecord) {
    const error = new Error('Invalid or expired reset token');
    error.statusCode = 400;
    throw error;
  }

  const tokenMatches = await bcrypt.compare(rawToken, resetRecord.tokenHash);
  if (!tokenMatches) {
    const error = new Error('Invalid or expired reset token');
    error.statusCode = 400;
    throw error;
  }

  const updated = await updateAccountPassword(
    resetRecord.accountType,
    resetRecord.accountId,
    newPassword
  );

  if (!updated) {
    const error = new Error('Unable to reset password for this account');
    error.statusCode = 400;
    throw error;
  }

  resetRecord.usedAt = new Date();
  await resetRecord.save();

  await PasswordResetToken.deleteMany({ email: normalizedEmail, usedAt: null });

  return {
    success: true,
    message: 'Password reset successfully. You can now log in with your new password.',
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
