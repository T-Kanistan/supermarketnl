import express from 'express';
import { getAccountProfile, changeAccountPassword } from '../controllers/accountController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { validateRequest } from '../middlewares/validationMiddleware.js';
import { changeAccountPasswordRules } from '../validators/accountValidator.js';

const router = express.Router();

router.get('/profile', protect, getAccountProfile);
router.post(
  '/change-password',
  protect,
  changeAccountPasswordRules,
  validateRequest,
  changeAccountPassword
);

export default router;
