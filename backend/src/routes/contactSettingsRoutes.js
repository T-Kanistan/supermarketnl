import express from 'express';
import {
  getContactSettings,
  updateContactSettings,
} from '../controllers/contactSettingsController.js';
import { protect, adminOnly } from '../middlewares/authMiddleware.js';
import {
  updateContactSettingsRules,
  validateRequest,
} from '../middleware/validation.js';

const router = express.Router();

router.get('/', getContactSettings);

router.put(
  '/',
  protect,
  adminOnly,
  updateContactSettingsRules,
  validateRequest,
  updateContactSettings
);

export default router;
