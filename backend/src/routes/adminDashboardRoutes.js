import express from 'express';
import { getRecentApplications } from '../controllers/adminDashboardController.js';
import { protect, restrictTo } from '../middlewares/authMiddleware.js';
import { validateRequest } from '../middlewares/validationMiddleware.js';
import { recentApplicationsQueryRules } from '../validators/jobApplicationValidator.js';

const router = express.Router();

router.get(
  '/recent-applications',
  protect,
  restrictTo('admin', 'manager'),
  recentApplicationsQueryRules,
  validateRequest,
  getRecentApplications
);

export default router;
