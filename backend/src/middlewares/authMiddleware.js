import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Manager from '../models/Manager.js';
import { MANAGER_PERMISSIONS } from '../constants/managerPermissions.js';

const ACCESS_DENIED_MESSAGE =
  'Access Denied. You do not have permission to access this module.';

const buildManagerUser = (manager) => ({
  _id: manager._id,
  id: manager._id.toString(),
  fullName: manager.fullName,
  name: manager.fullName,
  email: manager.email,
  username: manager.username,
  phoneNumber: manager.phoneNumber,
  profileImage: manager.profileImage || '',
  role: 'manager',
  status: manager.status,
  accountType: 'manager',
  permissions: MANAGER_PERMISSIONS,
});

export const protect = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized, no token provided',
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const isManagerAccount =
      decoded.accountType === 'manager' || decoded.role === 'manager';

    if (isManagerAccount) {
      const manager = await Manager.findById(decoded.id);
      if (manager) {
        if (!manager.status) {
          return res.status(403).json({
            success: false,
            message: 'Account inactive. Please contact the administrator.',
          });
        }
        req.user = buildManagerUser(manager);
        return next();
      }

      const userAsManager = await User.findById(decoded.id).select('-password');
      if (userAsManager && userAsManager.role === 'manager') {
        if (!userAsManager.isActive) {
          return res.status(403).json({
            success: false,
            message: 'Account inactive. Please contact the administrator.',
          });
        }
        req.user = {
          ...userAsManager.toObject(),
          accountType: 'manager',
          permissions: MANAGER_PERMISSIONS,
        };
        return next();
      }

      return res.status(401).json({
        success: false,
        message: 'The user belonging to this token no longer exists',
      });
    }

    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'The user belonging to this token no longer exists',
      });
    }
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account inactive. Please contact the administrator.',
      });
    }

    req.user = {
      ...user.toObject(),
      accountType: user.role === 'manager' ? 'manager' : 'admin',
      permissions: user.role === 'manager' ? MANAGER_PERMISSIONS : ['*'],
    };
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, invalid token',
    });
  }
};

export const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: ACCESS_DENIED_MESSAGE,
      });
    }
    next();
  };
};

export const adminOnly = restrictTo('admin');
