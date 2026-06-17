import express from 'express';
import { getStats } from '../controllers/dashboardController.js';
import { protect, restrictTo } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Fetch dashboard statistics counts
router.get('/stats', protect, restrictTo('admin', 'manager'), getStats);

export default router;
