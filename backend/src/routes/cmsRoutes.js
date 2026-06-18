import express from 'express';
import { getCMS, updateCMS } from '../controllers/cmsController.js';
import {
  getMessages,
  submitMessage,
  markMessageRead,
  deleteMessage,
} from '../controllers/messageController.js';
import { protect, restrictTo } from '../middlewares/authMiddleware.js';
import { upload } from '../middlewares/uploadMiddleware.js';
import { validateRequest } from '../middlewares/validationMiddleware.js';
import { updateCmsRules } from '../validators/cmsValidator.js';
import { submitMessageRules, markMessageReadRules } from '../validators/messageValidator.js';

const router = express.Router();

router.get('/', getCMS);
router.get('/settings', getCMS);
router.put(
  '/',
  protect,
  restrictTo('admin', 'manager'),
  upload.single('logo'),
  updateCmsRules,
  validateRequest,
  updateCMS
);
router.put(
  '/settings',
  protect,
  restrictTo('admin', 'manager'),
  upload.single('logo'),
  updateCmsRules,
  validateRequest,
  updateCMS
);

router.get('/messages', protect, restrictTo('admin', 'manager'), getMessages);
router.post('/messages', submitMessageRules, validateRequest, submitMessage);
router.put(
  '/messages/:id/read',
  protect,
  restrictTo('admin', 'manager'),
  markMessageReadRules,
  validateRequest,
  markMessageRead
);
router.delete('/messages/:id', protect, restrictTo('admin', 'manager'), deleteMessage);

export default router;
