import express from 'express';
import { login, getProfile, changePassword, logout } from '../controllers/authController.js';
import {
  managerLogin,
  managerLogout,
} from '../controllers/managerAuthController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { validateRequest } from '../middlewares/validationMiddleware.js';
import { loginRules, changePasswordRules } from '../validators/authValidator.js';
import { managerLoginRules } from '../validators/managerValidator.js';

const router = express.Router();

router.post('/login', loginRules, validateRequest, login);
router.post('/manager-login', managerLoginRules, validateRequest, managerLogin);
router.post('/manager-logout', managerLogout);
router.post('/logout', logout);

router.get('/profile', protect, getProfile);
router.get('/me', protect, getProfile);
router.put('/change-password', protect, changePasswordRules, validateRequest, changePassword);

export default router;
