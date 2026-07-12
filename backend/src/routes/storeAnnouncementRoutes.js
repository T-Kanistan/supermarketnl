import express from 'express';
import { getStorefrontAnnouncements } from '../controllers/announcementController.js';

const router = express.Router();

/** Homepage-only: active store announcement banners (date + status filtered). */
router.get('/active', getStorefrontAnnouncements);

export default router;
