import User from '../models/User.js';
import Manager from '../models/Manager.js';
import jwt from 'jsonwebtoken';
import { MANAGER_PERMISSIONS } from '../constants/managerPermissions.js';
import * as accountService from '../services/accountService.js';
import * as managerService from '../services/managerService.js';
import { getRequestMetadata } from '../utils/requestMetadata.js';

const signToken = (payload) =>
  jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

const toAdminUser = (user) => ({
  id: user._id.toString(),
  name: user.name,
  fullName: user.name,
  email: user.email,
  role: user.role,
  status: user.isActive ? 'active' : 'inactive',
  last_login: user.lastLogin || null,
  mustChangePassword: user.mustChangePassword,
  permissions: ['*'],
});

const toManagerUser = (manager) => ({
  id: manager._id.toString(),
  name: manager.fullName,
  fullName: manager.fullName,
  email: manager.email,
  username: manager.username,
  phoneNumber: manager.phoneNumber,
  profileImage: manager.profileImage || '',
  role: 'manager',
  status: manager.status ? 'active' : 'inactive',
  last_login: manager.lastLogin || null,
  permissions: MANAGER_PERMISSIONS,
});

/**
 * @desc    Unified login for Admin and Manager
 * @route   POST /api/auth/login
 * @access  Public
 */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const loginValue = (email || '').trim().toLowerCase();

    if (!loginValue || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
    }

    // 1. Users collection (admin or manager role)
    const user = await User.findOne({ email: loginValue });

    if (user) {
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password',
        });
      }

      if (!user.isActive || user.accountStatus === 'Inactive' || user.accountStatus === 'Suspended') {
        return res.status(403).json({
          success: false,
          message: 'Account inactive. Please contact the administrator.',
        });
      }

      user.lastLogin = new Date();
      await user.save({ validateBeforeSave: false });

      const role = user.role === 'admin' ? 'admin' : 'manager';
      const token = signToken({
        id: user._id,
        role,
        accountType: role === 'admin' ? 'admin' : 'manager',
      });

      const authUser = toAdminUser(user);
      if (role === 'manager') {
        authUser.permissions = MANAGER_PERMISSIONS;
      }

      return res.status(200).json({
        success: true,
        message: 'Login successful',
        token,
        role,
        permissions: authUser.permissions,
        user: authUser,
      });
    }

    // 2. Legacy Manager collection
    const manager = await managerService.findManagerForLogin(loginValue);
    if (manager) {
      if (!manager.status) {
        return res.status(403).json({
          success: false,
          message: 'Account inactive. Please contact the administrator.',
        });
      }

      const isMatch = await manager.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password',
        });
      }

      manager.lastLogin = new Date();
      await manager.save({ validateBeforeSave: false });

      const token = signToken({
        id: manager._id,
        role: 'manager',
        accountType: 'manager',
      });

      return res.status(200).json({
        success: true,
        message: 'Login successful',
        token,
        role: 'manager',
        permissions: MANAGER_PERMISSIONS,
        user: toManagerUser(manager),
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Invalid email or password',
    });
  } catch (error) {
    next(error);
  }
};

export const getProfile = async (req, res, next) => {
  try {
    const data = await accountService.getAccountProfile(req.user);
    return res.status(200).json({
      success: true,
      user: {
        ...data,
        permissions: req.user.accountType === 'manager' ? MANAGER_PERMISSIONS : ['*'],
      },
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    next(error);
  }
};

export const changePassword = async (req, res, next) => {
  try {
    const metadata = getRequestMetadata(req);
    const result = await accountService.changeAccountPassword(req.user, req.body, metadata);
    return res.status(200).json(result);
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }
    next(error);
  }
};

export const logout = (req, res) => {
  res.status(200).json({ success: true, message: 'Logged out successfully' });
};
