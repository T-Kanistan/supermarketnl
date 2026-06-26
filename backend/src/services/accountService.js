import User from '../models/User.js';
import Manager from '../models/Manager.js';
import Admin from '../models/Admin.js';
import ManagerAccount from '../models/ManagerAccount.js';
import EmailVerification from '../models/EmailVerification.js';
import { sendEmailChangeOtpEmail } from './emailService.js';
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

export const updateAccountProfile = async (authUser, data, metadata = {}) => {
  if (!authUser?._id) {
    const error = new Error('Not authenticated');
    error.statusCode = 401;
    throw error;
  }

  const name = data.name || data.fullName;
  const email = data.email ? String(data.email).trim().toLowerCase() : undefined;

  // Validate email uniqueness if email is changed
  const checkEmailUniqueness = async (model, excludeId) => {
    if (!email) return;
    const existing = await model.findOne({ email, _id: { $ne: excludeId } });
    if (existing) {
      const error = new Error('Email address is already in use');
      error.statusCode = 400;
      throw error;
    }
  };

  const source = authUser.accountSource || authUser.accountType;
  const isManager = authUser.accountType === 'manager' || authUser.role === 'manager';

  if (source === 'admin') {
    const admin = await Admin.findById(authUser._id);
    if (admin) {
      if (email) await checkEmailUniqueness(Admin, admin._id);
      if (name) admin.name = name;
      if (email) admin.email = email;
      await admin.save();
      
      await logAuditEvent({
        userId: admin._id,
        accountType: 'admin',
        action: 'PROFILE_UPDATED',
        module: 'ACCOUNT',
        description: `Admin updated profile (name: ${admin.name}, email: ${admin.email})`,
        ipAddress: metadata.ipAddress,
        browser: metadata.browser,
        device: metadata.device,
        userAgent: metadata.userAgent,
      });

      return formatAccountProfile({ ...admin.toObject(), name: admin.name, role: 'admin', isActive: admin.isActive }, 'admin');
    }
  }

  if (source === 'manager') {
    const managerAccount = await ManagerAccount.findById(authUser._id);
    if (managerAccount) {
      if (email) await checkEmailUniqueness(ManagerAccount, managerAccount._id);
      if (name) managerAccount.name = name;
      if (email) managerAccount.email = email;
      await managerAccount.save();

      await logAuditEvent({
        userId: managerAccount._id,
        accountType: 'manager',
        action: 'PROFILE_UPDATED',
        module: 'ACCOUNT',
        description: `Manager updated profile (name: ${managerAccount.name}, email: ${managerAccount.email})`,
        ipAddress: metadata.ipAddress,
        browser: metadata.browser,
        device: metadata.device,
        userAgent: metadata.userAgent,
      });

      return formatAccountProfile({
        ...managerAccount.toObject(),
        fullName: managerAccount.name,
        status: managerAccount.isActive,
      }, 'manager');
    }
  }

  if (isManager) {
    const manager = await Manager.findById(authUser._id);
    if (manager) {
      if (email) await checkEmailUniqueness(Manager, manager._id);
      if (name) manager.fullName = name;
      if (email) manager.email = email;
      await manager.save();

      await logAuditEvent({
        userId: manager._id,
        accountType: 'manager',
        action: 'PROFILE_UPDATED',
        module: 'ACCOUNT',
        description: `Manager updated profile (name: ${manager.fullName}, email: ${manager.email})`,
        ipAddress: metadata.ipAddress,
        browser: metadata.browser,
        device: metadata.device,
        userAgent: metadata.userAgent,
      });

      return formatAccountProfile(manager, 'manager');
    }

    const userAsManager = await User.findById(authUser._id);
    if (userAsManager) {
      if (email) await checkEmailUniqueness(User, userAsManager._id);
      if (name) userAsManager.name = name;
      if (email) userAsManager.email = email;
      await userAsManager.save();

      await logAuditEvent({
        userId: userAsManager._id,
        accountType: 'manager',
        action: 'PROFILE_UPDATED',
        module: 'ACCOUNT',
        description: `Manager updated profile (name: ${userAsManager.name}, email: ${userAsManager.email})`,
        ipAddress: metadata.ipAddress,
        browser: metadata.browser,
        device: metadata.device,
        userAgent: metadata.userAgent,
      });

      return formatAccountProfile(userAsManager, 'manager');
    }
  }

  const user = await User.findById(authUser._id);
  if (user) {
    if (email) await checkEmailUniqueness(User, user._id);
    if (name) user.name = name;
    if (email) user.email = email;
    await user.save();

    await logAuditEvent({
      userId: user._id,
      accountType: user.role === 'manager' ? 'manager' : 'admin',
      action: 'PROFILE_UPDATED',
      module: 'ACCOUNT',
      description: `User updated profile (name: ${user.name}, email: ${user.email})`,
      ipAddress: metadata.ipAddress,
      browser: metadata.browser,
      device: metadata.device,
      userAgent: metadata.userAgent,
    });

    return formatAccountProfile(user, user.role === 'manager' ? 'manager' : 'admin');
  }

  // Fallback to Admin search
  const fallbackAdmin = await Admin.findById(authUser._id);
  if (fallbackAdmin) {
    if (email) await checkEmailUniqueness(Admin, fallbackAdmin._id);
    if (name) fallbackAdmin.name = name;
    if (email) fallbackAdmin.email = email;
    await fallbackAdmin.save();

    await logAuditEvent({
      userId: fallbackAdmin._id,
      accountType: 'admin',
      action: 'PROFILE_UPDATED',
      module: 'ACCOUNT',
      description: `Admin updated profile (name: ${fallbackAdmin.name}, email: ${fallbackAdmin.email})`,
      ipAddress: metadata.ipAddress,
      browser: metadata.browser,
      device: metadata.device,
      userAgent: metadata.userAgent,
    });

    return formatAccountProfile({ ...fallbackAdmin.toObject(), name: fallbackAdmin.name, role: 'admin', isActive: fallbackAdmin.isActive }, 'admin');
  }

  const error = new Error('User not found');
  error.statusCode = 404;
  throw error;
};

// Request an email change: Validate, generate OTP, save verification doc, send email
export const requestEmailChange = async (authUser, { newEmail }) => {
  if (!authUser?._id) {
    const error = new Error('Not authenticated');
    error.statusCode = 401;
    throw error;
  }

  const email = String(newEmail || '').trim().toLowerCase();
  if (!email) {
    const error = new Error('New email address is required');
    error.statusCode = 400;
    throw error;
  }

  // Check email format
  const emailRegex = /^\S+@\S+\.\S+$/;
  if (!emailRegex.test(email)) {
    const error = new Error('Please provide a valid email address');
    error.statusCode = 400;
    throw error;
  }

  const source = authUser.accountSource || authUser.accountType;

  // Resolve user type and check uniqueness across all potential tables
  const checkEmailUniquenessAll = async () => {
    const matches = await Promise.all([
      Admin.findOne({ email }),
      ManagerAccount.findOne({ email }),
      Manager.findOne({ email }),
      User.findOne({ email }),
    ]);
    if (matches.some(Boolean)) {
      const error = new Error('Email address is already in use by another account');
      error.statusCode = 400;
      throw error;
    }
  };
  await checkEmailUniquenessAll();

  // Find user's active model type
  let userModel = 'User';
  if (source === 'admin') userModel = 'Admin';
  else if (source === 'manager') userModel = 'ManagerAccount';
  else if (authUser.accountType === 'manager' || authUser.role === 'manager') {
    const isMgr = await Manager.findById(authUser._id);
    if (isMgr) userModel = 'Manager';
  }

  // Generate 6-digit OTP code
  const rawOtp = Math.floor(100000 + Math.random() * 900000).toString();
  const hashedOtp = await EmailVerification.hashOtp(rawOtp);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

  // Save or replace the verification request
  await EmailVerification.deleteMany({ userId: authUser._id });
  await EmailVerification.create({
    userId: authUser._id,
    userModel,
    pendingEmail: email,
    otpCode: hashedOtp,
    expiresAt,
  });

  // Send verification email
  const emailResult = await sendEmailChangeOtpEmail({ to: email, otpCode: rawOtp });
  if (!emailResult.sent && !emailResult.simulated) {
    const error = new Error(`Failed to send verification email: ${emailResult.error}`);
    error.statusCode = 500;
    throw error;
  }

  return {
    success: true,
    message: 'Verification code sent to your new email address. Please check your inbox.',
  };
};

// Verify the email change: Check OTP, save new email, cleanup
export const verifyEmailChange = async (authUser, { otpCode }, metadata = {}) => {
  if (!authUser?._id) {
    const error = new Error('Not authenticated');
    error.statusCode = 401;
    throw error;
  }

  const code = String(otpCode || '').trim();
  if (!code) {
    const error = new Error('Verification code is required');
    error.statusCode = 400;
    throw error;
  }

  // Fetch pending verification
  const verification = await EmailVerification.findOne({ userId: authUser._id });
  if (!verification) {
    const error = new Error('No pending email change request found, or verification code expired.');
    error.statusCode = 404;
    throw error;
  }

  if (verification.expiresAt <= new Date()) {
    await EmailVerification.deleteOne({ _id: verification._id });
    const error = new Error('Verification code has expired. Please request a new one.');
    error.statusCode = 400;
    throw error;
  }

  const isMatch = await verification.compareOtp(code);
  if (!isMatch) {
    const error = new Error('Invalid verification code.');
    error.statusCode = 400;
    throw error;
  }

  const newEmail = verification.pendingEmail;
  const userModel = verification.userModel;

  let updatedRecord = null;

  // Apply update to the resolved model
  if (userModel === 'Admin') {
    const doc = await Admin.findById(authUser._id);
    if (doc) {
      doc.email = newEmail;
      await doc.save();
      updatedRecord = formatAccountProfile({ ...doc.toObject(), name: doc.name, role: 'admin', isActive: doc.isActive }, 'admin');
    }
  } else if (userModel === 'ManagerAccount') {
    const doc = await ManagerAccount.findById(authUser._id);
    if (doc) {
      doc.email = newEmail;
      await doc.save();
      updatedRecord = formatAccountProfile({
        ...doc.toObject(),
        fullName: doc.name,
        status: doc.isActive,
      }, 'manager');
    }
  } else if (userModel === 'Manager') {
    const doc = await Manager.findById(authUser._id);
    if (doc) {
      doc.email = newEmail;
      await doc.save();
      updatedRecord = formatAccountProfile(doc, 'manager');
    }
  } else {
    const doc = await User.findById(authUser._id);
    if (doc) {
      doc.email = newEmail;
      await doc.save();
      updatedRecord = formatAccountProfile(doc, doc.role === 'manager' ? 'manager' : 'admin');
    }
  }

  if (!updatedRecord) {
    const error = new Error('User record not found to update.');
    error.statusCode = 404;
    throw error;
  }

  // Log auditing
  await logAuditEvent({
    userId: authUser._id,
    accountType: userModel === 'Admin' ? 'admin' : 'manager',
    action: 'EMAIL_CHANGED',
    module: 'ACCOUNT',
    description: `User successfully verified and changed email to ${newEmail}`,
    ipAddress: metadata.ipAddress,
    browser: metadata.browser,
    device: metadata.device,
    userAgent: metadata.userAgent,
  });

  // Clean up
  await EmailVerification.deleteOne({ _id: verification._id });

  return updatedRecord;
};

