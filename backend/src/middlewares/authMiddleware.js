import { verifyToken } from './verifyToken.js';
import { adminOnly as adminOnlyMiddleware } from './adminOnly.js';

export const protect = verifyToken;

export const restrictTo = (...roles) => {
  return (req, res, next) => {
    const role = req.user?.role || req.user?.accountType;
    if (!roles.includes(role)) {
      return res.status(403).json({
        success: false,
        message: 'Access Denied. You do not have permission to access this module.',
      });
    }
    next();
  };
};

export const adminOnly = adminOnlyMiddleware;

export { verifyToken } from './verifyToken.js';
