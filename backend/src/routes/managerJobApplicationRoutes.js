import express from 'express';
import { getJobApplications } from '../controllers/jobApplicationController.js';
import { protect, restrictTo } from '../middlewares/authMiddleware.js';
import { validateRequest } from '../middlewares/validationMiddleware.js';
import { jobApplicationListQueryRules } from '../validators/jobApplicationValidator.js';

const router = express.Router();

router.get(
  '/',
  protect,
  restrictTo('admin', 'manager'),
  jobApplicationListQueryRules,
  validateRequest,
  getJobApplications
);

export default router;
