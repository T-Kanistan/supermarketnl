import express from 'express';
import {
  getAccountProfile,
  changeAccountPassword,
  updateAccountProfile,
} from '../controllers/accountController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { validateRequest } from '../middlewares/validationMiddleware.js';
import {
  changeAccountPasswordRules,
  updateAccountProfileRules,
} from '../validators/accountValidator.js';

const router = express.Router();

router.get('/profile', protect, getAccountProfile);
router.put('/profile', protect, updateAccountProfileRules, validateRequest, updateAccountProfile);
router.post(
  '/change-password',
  protect,
  changeAccountPasswordRules,
  validateRequest,
  changeAccountPassword
);

export default router;
