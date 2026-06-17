import express from 'express';
import {
  login,
  getProfile,
  changePassword,
  getManagers,
  createManager,
  updateManager,
  deleteManager,
  resetManagerPassword,
} from '../controllers/authController.js';
import { protect, restrictTo } from '../middlewares/authMiddleware.js';
import { validateRequest } from '../middlewares/validationMiddleware.js';
import {
  loginRules,
  changePasswordRules,
  createManagerRules,
  updateManagerRules,
  resetPasswordRules,
} from '../validators/authValidator.js';

const router = express.Router();

// Public route for login
router.post('/login', loginRules, validateRequest, login);

// Private profile and self password-change routes
router.get('/profile', protect, getProfile);
router.get('/me', protect, getProfile);
router.post('/logout', (req, res) => res.status(200).json({ success: true, message: 'Logged out successful' }));
router.put('/change-password', protect, changePasswordRules, validateRequest, changePassword);

// Admin-only manager CRUD routes
router.get('/managers', protect, restrictTo('admin'), getManagers);
router.post('/managers', protect, restrictTo('admin'), createManagerRules, validateRequest, createManager);
router.put('/managers/:id', protect, restrictTo('admin'), updateManagerRules, validateRequest, updateManager);
router.delete('/managers/:id', protect, restrictTo('admin'), deleteManager);
router.put(
  '/managers/:id/reset-password',
  protect,
  restrictTo('admin'),
  resetPasswordRules,
  validateRequest,
  resetManagerPassword
);

export default router;
