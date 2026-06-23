import User from '../models/User.js';
import Manager from '../models/Manager.js';
import { logManagerActivity } from './activityLogService.js';
import { logAuditEvent } from './auditLogService.js';

const formatRole = (role) => {
  if (!role) return 'User';
  const normalized = String(role).toLowerCase();
  if (normalized === 'admin') return 'Admin';
  if (normalized === 'manager') return 'Manager';
  return role.charAt(0).toUpperCase() + role.slice(1);
};

const resolveSecurityStatus = (accountStatus) => {
  if (accountStatus === 'Active') return 'Authenticated';
  if (accountStatus === 'Suspended') return 'Suspended';
  if (accountStatus === 'Deleted') return 'Deleted';
  return 'Inactive';
};

const resolveAdminAccountStatus = (user) => {
  if (user.accountStatus) return user.accountStatus;
  return user.isActive ? 'Active' : 'Inactive';
};

const resolveManagerAccountStatus = (manager) => {
  if (manager.accountStatus) return manager.accountStatus;
  return manager.status ? 'Active' : 'Inactive';
};

export const formatAccountProfile = (record, accountType) => {
  const isManager = accountType === 'manager';
  const fullName = isManager ? record.fullName : record.name || record.fullName;
  const accountStatus = isManager
    ? resolveManagerAccountStatus(record)
    : resolveAdminAccountStatus(record);

  const roleKey = isManager ? 'manager' : String(record.role || 'admin').toLowerCase();

  return {
    id: record._id?.toString?.() ?? record.id,
    fullName: fullName || '',
    name: fullName || '',
    email: record.email || '',
    role: roleKey,
    displayRole: formatRole(roleKey),
    accountStatus,
    securityStatus: resolveSecurityStatus(accountStatus),
    lastPasswordChangedAt: record.lastPasswordChangedAt || null,
    profileImage: record.profileImage || '',
    accountType,
  };
};

export const getAccountProfile = async (authUser) => {
  if (!authUser?._id) {
    const error = new Error('Not authenticated');
    error.statusCode = 401;
    throw error;
  }

  if (authUser.accountType === 'manager') {
    const manager = await Manager.findById(authUser._id);
    if (!manager) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }
    return formatAccountProfile(manager, 'manager');
  }

  const user = await User.findById(authUser._id);
  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }
  return formatAccountProfile(user, 'admin');
};

const validatePasswordChange = ({ currentPassword, newPassword, confirmPassword }) => {
  if (!currentPassword) {
    const error = new Error('Current password is required');
    error.statusCode = 400;
    throw error;
  }
  if (!newPassword) {
    const error = new Error('New password is required');
    error.statusCode = 400;
    throw error;
  }
  if (newPassword.length < 6 || newPassword.length > 50) {
    const error = new Error('New password must be between 6 and 50 characters');
    error.statusCode = 400;
    throw error;
  }
  if (!confirmPassword) {
    const error = new Error('Confirm password is required');
    error.statusCode = 400;
    throw error;
  }
  if (newPassword !== confirmPassword) {
    const error = new Error('New password and confirm password do not match');
    error.statusCode = 400;
    throw error;
  }
  if (currentPassword === newPassword) {
    const error = new Error('New password must not match current password');
    error.statusCode = 400;
    throw error;
  }
};

const recordPasswordChangeLogs = async ({ userId, accountType, metadata }) => {
  await logManagerActivity({
    user: { _id: userId, role: accountType === 'manager' ? 'manager' : 'admin' },
    action: 'PASSWORD_CHANGED',
    module: 'ACCOUNT',
    description: 'User changed account password',
  });

  await logAuditEvent({
    userId,
    accountType,
    action: 'PASSWORD_CHANGED',
    module: 'ACCOUNT',
    description: 'User changed account password',
    ipAddress: metadata.ipAddress,
    browser: metadata.browser,
    device: metadata.device,
    userAgent: metadata.userAgent,
  });
};

export const changeAccountPassword = async (authUser, body, metadata = {}) => {
  const currentPassword = body.currentPassword || body.oldPassword;
  const { newPassword, confirmPassword } = body;

  validatePasswordChange({ currentPassword, newPassword, confirmPassword });

  if (authUser.accountType === 'manager') {
    const manager = await Manager.findById(authUser._id).select('+passwordHash');
    if (!manager) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }

    const isMatch = await manager.comparePassword(currentPassword);
    if (!isMatch) {
      const error = new Error('Current password is incorrect');
      error.statusCode = 400;
      throw error;
    }

    manager.passwordHash = await Manager.hashPassword(newPassword);
    manager.lastPasswordChangedAt = new Date();
    await manager.save();

    await recordPasswordChangeLogs({
      userId: manager._id,
      accountType: 'manager',
      metadata,
    });

    return { success: true, message: 'Password changed successfully' };
  }

  const user = await User.findById(authUser._id);
  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    const error = new Error('Current password is incorrect');
    error.statusCode = 400;
    throw error;
  }

  user.password = newPassword;
  user.mustChangePassword = false;
  user.lastPasswordChangedAt = new Date();
  await user.save();

  await recordPasswordChangeLogs({
    userId: user._id,
    accountType: 'admin',
    metadata,
  });

  return { success: true, message: 'Password changed successfully' };
};
