import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import { MANAGER_PERMISSIONS } from '../constants/managerPermissions.js';
import * as accountService from '../services/accountService.js';
import { getRequestMetadata } from '../utils/requestMetadata.js';

const generateAdminToken = (user) =>
  jwt.sign(
    { id: user._id, role: user.role, accountType: 'admin' },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

const toAdminUser = (user) => ({
  id: user._id.toString(),
  name: user.name,
  email: user.email,
  role: user.role,
  mustChangePassword: user.mustChangePassword,
  permissions: ['*'],
});

/**
 * @desc    Login Super Admin
 * @route   POST /api/auth/login
 * @access  Public
 */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email.toLowerCase(), role: 'admin' });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account is deactivated. Please contact the administrator.',
      });
    }

    const token = generateAdminToken(user);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      role: user.role,
      permissions: ['*'],
      user: toAdminUser(user),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get Current Logged-in User Profile
 * @route   GET /api/auth/me
 * @access  Private
 */
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

/**
 * @desc    Change Logged-in User Password
 * @route   PUT /api/auth/change-password
 * @access  Private
 */
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
