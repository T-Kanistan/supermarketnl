import express from 'express';
import {
  getContactSettings,
  updateContactSettings,
} from '../controllers/contactSettingsController.js';
import { protect, restrictTo } from '../middlewares/authMiddleware.js';
import {
  updateContactSettingsRules,
  validateRequest,
} from '../middleware/validation.js';

const router = express.Router();

router.get('/', getContactSettings);

router.put(
  '/',
  protect,
  restrictTo('admin', 'manager'),
  updateContactSettingsRules,
  validateRequest,
  updateContactSettings
);

export default router;
