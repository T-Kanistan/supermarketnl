import express from 'express';
import {
  login,
  forgotPassword,
  resetPassword,
  getProfile,
  changePassword,
  logout,
} from '../controllers/authController.js';
import {
  managerLogin,
  managerLogout,
} from '../controllers/managerAuthController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { authRateLimiter } from '../middlewares/authRateLimiter.js';
import { validateRequest } from '../middlewares/validationMiddleware.js';
import {
  loginRules,
  forgotPasswordRules,
  resetPasswordRules,
  changePasswordRules,
} from '../validators/authValidator.js';
import { managerLoginRules } from '../validators/managerValidator.js';

const router = express.Router();

router.post('/login', authRateLimiter, loginRules, validateRequest, login);
router.post('/forgot-password', authRateLimiter, forgotPasswordRules, validateRequest, forgotPassword);
router.post('/reset-password', authRateLimiter, resetPasswordRules, validateRequest, resetPassword);
router.post('/manager-login', authRateLimiter, managerLoginRules, validateRequest, managerLogin);
router.post('/manager-logout', managerLogout);
router.post('/logout', logout);

router.get('/profile', protect, getProfile);
router.get('/me', protect, getProfile);
router.put('/change-password', protect, changePasswordRules, validateRequest, changePassword);

export default router;
