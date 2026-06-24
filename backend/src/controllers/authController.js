import * as portalAuthService from '../services/portalAuthService.js';
import * as accountService from '../services/accountService.js';
import { getRequestMetadata } from '../utils/requestMetadata.js';
import { MANAGER_PERMISSIONS } from '../constants/managerPermissions.js';

/**
 * @desc    Unified login for Admin and Manager portal accounts
 * @route   POST /api/auth/login
 * @access  Public
 */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await portalAuthService.loginWithEmailPassword(email, password);
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

/**
 * @desc    Request password reset email
 * @route   POST /api/auth/forgot-password
 * @access  Public
 */
export const forgotPassword = async (req, res, next) => {
  try {
    const result = await portalAuthService.requestPasswordReset(req.body.email);
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

/**
 * @desc    Reset password using token from email
 * @route   POST /api/auth/reset-password
 * @access  Public
 */
export const resetPassword = async (req, res, next) => {
  try {
    const { email, token, newPassword, confirmPassword } = req.body;
    const result = await portalAuthService.resetPasswordWithToken({
      email,
      token,
      newPassword,
      confirmPassword,
    });
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

export const getProfile = async (req, res, next) => {
  try {
    const data = await accountService.getAccountProfile(req.user);
    return res.status(200).json({
      success: true,
      user: {
        ...data,
        permissions:
          req.user.accountType === 'manager' || req.user.role === 'manager'
            ? MANAGER_PERMISSIONS
            : ['*'],
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
