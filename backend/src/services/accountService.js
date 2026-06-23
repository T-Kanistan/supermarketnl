import User from '../models/User.js';
import Manager from '../models/Manager.js';
import Admin from '../models/Admin.js';
import ManagerAccount from '../models/ManagerAccount.js';
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

  const source = authUser.accountSource || authUser.accountType;

  if (source === 'admin') {
    const admin = await Admin.findById(authUser._id).select('-password');
    if (admin) {
      return formatAccountProfile(
        { ...admin.toObject(), name: admin.name, role: 'admin', isActive: admin.isActive },
        'admin'
      );
    }
  }

  if (source === 'manager') {
    const managerAccount = await ManagerAccount.findById(authUser._id).select('-password');
    if (managerAccount) {
      return formatAccountProfile(
        {
          ...managerAccount.toObject(),
          fullName: managerAccount.name,
          status: managerAccount.isActive,
        },
        'manager'
      );
    }
  }

  if (authUser.accountType === 'manager' || authUser.role === 'manager') {
    const manager = await Manager.findById(authUser._id);
    if (manager) {
      return formatAccountProfile(manager, 'manager');
    }

    const userAsManager = await User.findById(authUser._id);
    if (userAsManager) {
      return formatAccountProfile(userAsManager, 'manager');
    }
  }

  const user = await User.findById(authUser._id);
  if (user) {
    return formatAccountProfile(user, user.role === 'manager' ? 'manager' : 'admin');
  }

  const admin = await Admin.findById(authUser._id).select('-password');
  if (admin) {
    return formatAccountProfile(
      { ...admin.toObject(), name: admin.name, role: 'admin', isActive: admin.isActive },
      'admin'
    );
  }

  const error = new Error('User not found');
  error.statusCode = 404;
  throw error;
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

  const source = authUser.accountSource || authUser.accountType;
  const isManager = authUser.accountType === 'manager' || authUser.role === 'manager';

  if (source === 'admin') {
    const admin = await Admin.findById(authUser._id).select('+password');
    if (admin) {
      const isMatch = await admin.comparePassword(currentPassword);
      if (!isMatch) {
        const error = new Error('Current password is incorrect');
        error.statusCode = 400;
        throw error;
      }

      admin.password = newPassword;
      admin.lastPasswordChangedAt = new Date();
      await admin.save();

      await recordPasswordChangeLogs({
        userId: admin._id,
        accountType: 'admin',
        metadata,
      });

      return { success: true, message: 'Password changed successfully' };
    }
  }

  if (source === 'manager' || isManager) {
    const managerAccount = await ManagerAccount.findById(authUser._id).select('+password');
    if (managerAccount) {
      const isMatch = await managerAccount.comparePassword(currentPassword);
      if (!isMatch) {
        const error = new Error('Current password is incorrect');
        error.statusCode = 400;
        throw error;
      }

      managerAccount.password = newPassword;
      managerAccount.lastPasswordChangedAt = new Date();
      await managerAccount.save();

      await recordPasswordChangeLogs({
        userId: managerAccount._id,
        accountType: 'manager',
        metadata,
      });

      return { success: true, message: 'Password changed successfully' };
    }

    const manager = await Manager.findById(authUser._id).select('+passwordHash');
    if (manager) {
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

    const userAsManager = await User.findById(authUser._id);
    if (userAsManager) {
      const isMatch = await userAsManager.comparePassword(currentPassword);
      if (!isMatch) {
        const error = new Error('Current password is incorrect');
        error.statusCode = 400;
        throw error;
      }

      userAsManager.password = newPassword;
      userAsManager.lastPasswordChangedAt = new Date();
      await userAsManager.save();

      await recordPasswordChangeLogs({
        userId: userAsManager._id,
        accountType: 'manager',
        metadata,
      });

      return { success: true, message: 'Password changed successfully' };
    }
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
