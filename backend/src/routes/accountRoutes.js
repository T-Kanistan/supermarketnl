import express from 'express';
import {
  getAccountProfile,
  changeAccountPassword,
  updateAccountProfile,
  requestEmailChange,
  verifyEmailChange,
} from '../controllers/accountController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { validateRequest } from '../middlewares/validationMiddleware.js';
import {
  changeAccountPasswordRules,
  updateAccountProfileRules,
  requestEmailChangeRules,
  verifyEmailChangeRules,
} from '../validators/accountValidator.js';

const router = express.Router();

router.get('/profile', protect, getAccountProfile);
router.put('/profile', protect, updateAccountProfileRules, validateRequest, updateAccountProfile);
router.post(
  '/profile/request-email-change',
  protect,
  requestEmailChangeRules,
  validateRequest,
  requestEmailChange
);
router.post(
  '/profile/verify-email-change',
  protect,
  verifyEmailChangeRules,
  validateRequest,
  verifyEmailChange
);
router.post(
  '/change-password',
  protect,
  changeAccountPasswordRules,
  validateRequest,
  changeAccountPassword
);

export default router;
