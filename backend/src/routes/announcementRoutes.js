import express from 'express';
import {
  getAnnouncements,
  getAllAnnouncements,
  getAnnouncementById,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
} from '../controllers/announcementController.js';
import { protect, restrictTo } from '../middlewares/authMiddleware.js';
import { upload } from '../middlewares/uploadMiddleware.js';
import { validateRequest } from '../middlewares/validationMiddleware.js';
import { createAnnouncementRules, updateAnnouncementRules } from '../validators/announcementValidator.js';

const router = express.Router();

// Public route to fetch active and current announcements
router.get('/', getAnnouncements);

// Protected routes to fetch all and single announcement
router.get('/all', protect, restrictTo('admin', 'manager'), getAllAnnouncements);
router.get('/:id', protect, restrictTo('admin', 'manager'), getAnnouncementById);

// Protected CRUD routes
router.post(
  '/',
  protect,
  restrictTo('admin', 'manager'),
  upload.single('image'),
  createAnnouncementRules,
  validateRequest,
  createAnnouncement
);
router.put(
  '/:id',
  protect,
  restrictTo('admin', 'manager'),
  upload.single('image'),
  updateAnnouncementRules,
  validateRequest,
  updateAnnouncement
);
router.delete('/:id', protect, restrictTo('admin', 'manager'), deleteAnnouncement);

export default router;
