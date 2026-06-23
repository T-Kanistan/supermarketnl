import jwt from 'jsonwebtoken';
import { MANAGER_PERMISSIONS } from '../constants/managerPermissions.js';
import * as managerService from '../services/managerService.js';
import { successResponse } from '../utils/apiResponse.js';

const signManagerToken = (manager) =>
  jwt.sign(
    {
      id: manager._id,
      role: 'manager',
      accountType: 'manager',
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

const toAuthUser = (manager) => ({
  id: manager._id.toString(),
  fullName: manager.fullName,
  name: manager.fullName,
  email: manager.email,
  username: manager.username,
  phoneNumber: manager.phoneNumber,
  profileImage: manager.profileImage || '',
  role: 'manager',
  status: manager.status,
  permissions: MANAGER_PERMISSIONS,
});

export const managerLogin = async (req, res, next) => {
  try {
    const { login, password } = req.body;
    const manager = await managerService.findManagerForLogin(login);

    if (!manager) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    if (!manager.status) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact the administrator.',
      });
    }

    const isMatch = await manager.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    const token = signManagerToken(manager);
    const user = toAuthUser(manager);

    return res.status(200).json({
      success: true,
      token,
      role: 'manager',
      permissions: MANAGER_PERMISSIONS,
      user,
    });
  } catch (error) {
    next(error);
  }
};

export const managerLogout = async (req, res) => {
  return successResponse(res, 200, 'Logged out successfully');
};

export const getManagerProfile = async (req, res, next) => {
  try {
    const data = await managerService.getManagerById(req.user._id);
    return successResponse(res, 200, 'Profile retrieved successfully', {
      ...data,
      role: 'manager',
      permissions: MANAGER_PERMISSIONS,
    });
  } catch (error) {
    next(error);
  }
};

export const changeManagerPassword = async (req, res, next) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const result = await managerService.changeManagerPassword(
      req.user._id,
      oldPassword,
      newPassword
    );
    return successResponse(res, 200, result.message);
  } catch (error) {
    next(error);
  }
};
