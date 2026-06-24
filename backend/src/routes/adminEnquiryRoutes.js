import express from 'express';
import {
  getEnquiries,
  getEnquiryById,
  markEnquiryRead,
  markEnquiryReplied,
  closeEnquiry,
  replyToEnquiry,
  deleteEnquiry,
  getEnquiryStats,
  updateEnquiryStatus,
} from '../controllers/enquiryController.js';
import { protect, restrictTo, adminOnly } from '../middlewares/authMiddleware.js';
import { validateRequest } from '../middlewares/validationMiddleware.js';
import {
  enquiryIdRules,
  enquiryListQueryRules,
  enquiryReplyRules,
  enquiryStatusRules,
} from '../validators/enquiryValidator.js';

const router = express.Router();
const auth = [protect, restrictTo('admin', 'manager')];

router.get('/stats', ...auth, getEnquiryStats);
router.get('/', ...auth, enquiryListQueryRules, validateRequest, getEnquiries);
router.get('/:id', ...auth, enquiryIdRules, validateRequest, getEnquiryById);

router.patch('/:id/status', ...auth, enquiryStatusRules, validateRequest, updateEnquiryStatus);
router.put('/:id/read', ...auth, enquiryIdRules, validateRequest, markEnquiryRead);
router.put('/:id/replied', ...auth, enquiryIdRules, validateRequest, markEnquiryReplied);
router.put('/:id/close', ...auth, enquiryIdRules, validateRequest, closeEnquiry);
router.post('/:id/reply', ...auth, enquiryReplyRules, validateRequest, replyToEnquiry);
router.delete('/:id', protect, adminOnly, enquiryIdRules, validateRequest, deleteEnquiry);

export default router;
