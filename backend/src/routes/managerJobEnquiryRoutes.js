import express from 'express';
import { getJobEnquiries } from '../controllers/jobEnquiryController.js';
import { protect, restrictTo } from '../middlewares/authMiddleware.js';
import { validateRequest } from '../middlewares/validationMiddleware.js';
import { jobEnquiryListQueryRules } from '../validators/jobEnquiryValidator.js';

const router = express.Router();

router.get(
  '/',
  protect,
  restrictTo('admin', 'manager'),
  jobEnquiryListQueryRules,
  validateRequest,
  getJobEnquiries
);

export default router;
