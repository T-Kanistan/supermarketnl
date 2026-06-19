import express from 'express';
import {
  getMessages,
  submitMessage,
  markMessageRead,
  deleteMessage,
} from '../controllers/messageController.js';
import { protect, restrictTo } from '../middlewares/authMiddleware.js';
import { validateRequest } from '../middlewares/validationMiddleware.js';
import { submitMessageRules, markMessageReadRules } from '../validators/messageValidator.js';
import { enquiryRateLimit } from '../middleware/enquiryRateLimit.js';

const router = express.Router();

router.post('/', enquiryRateLimit, submitMessageRules, validateRequest, submitMessage);
router.get('/', protect, restrictTo('admin', 'manager'), getMessages);
router.put(
  '/:id/read',
  protect,
  restrictTo('admin', 'manager'),
  markMessageReadRules,
  validateRequest,
  markMessageRead
);
router.delete('/:id', protect, restrictTo('admin', 'manager'), deleteMessage);

export default router;
