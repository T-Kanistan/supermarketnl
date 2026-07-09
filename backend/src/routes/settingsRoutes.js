import express from 'express';
import { getSettings, updateSettings } from '../controllers/siteSettingsController.js';
import { protect, adminOnly } from '../middlewares/authMiddleware.js';
import { upload } from '../middlewares/uploadMiddleware.js';
import { updateSiteSettingsRules, validateRequest } from '../middleware/validation.js';

const router = express.Router();

router.get('/', getSettings);
router.put('/', protect, adminOnly, updateSiteSettingsRules, validateRequest, upload.single('storeLogo'), updateSettings);

export default router;
