import express from 'express';
import { getStats, getActiveCounts } from '../controllers/dashboardController.js';
import { protect, restrictTo } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/active-counts', protect, restrictTo('admin', 'manager'), getActiveCounts);
router.get('/stats', protect, restrictTo('admin', 'manager'), getStats);

export default router;
