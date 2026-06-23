import express from 'express';
import {
  getJobEnquiries,
  getJobEnquiry,
  markEnquiryReplied,
  removeJobEnquiry,
} from '../controllers/jobEnquiryController.js';
import { protect, restrictTo, adminOnly } from '../middlewares/authMiddleware.js';
import { validateRequest } from '../middlewares/validationMiddleware.js';
import { jobEnquiryIdRules, jobEnquiryListQueryRules } from '../validators/jobEnquiryValidator.js';

const router = express.Router();
const auth = [protect, restrictTo('admin', 'manager')];

router.get('/', ...auth, jobEnquiryListQueryRules, validateRequest, getJobEnquiries);
router.get('/:id', ...auth, jobEnquiryIdRules, validateRequest, getJobEnquiry);
router.patch('/:id/replied', ...auth, jobEnquiryIdRules, validateRequest, markEnquiryReplied);
router.delete('/:id', protect, adminOnly, jobEnquiryIdRules, validateRequest, removeJobEnquiry);

export default router;
