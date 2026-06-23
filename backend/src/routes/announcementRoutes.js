import express from 'express';
import {
  getAnnouncements,
  getAnnouncementById,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  searchAnnouncements,
} from '../controllers/announcementController.js';
import { protect, restrictTo, adminOnly } from '../middlewares/authMiddleware.js';
import { validateRequest } from '../middlewares/validationMiddleware.js';
import { announcementBannerUpload } from '../middlewares/announcementUploadMiddleware.js';
import {
  createAnnouncementRules,
  updateAnnouncementRules,
  announcementIdRules,
  announcementListQueryRules,
  searchAnnouncementRules,
} from '../validators/announcementValidator.js';

const router = express.Router();
const auth = [protect, restrictTo('admin', 'manager')];

router.get('/search', ...auth, searchAnnouncementRules, validateRequest, searchAnnouncements);
router.get('/', ...auth, announcementListQueryRules, validateRequest, getAnnouncements);
router.get('/all', ...auth, announcementListQueryRules, validateRequest, getAnnouncements);
router.get('/:id', ...auth, announcementIdRules, validateRequest, getAnnouncementById);

router.post(
  '/',
  ...auth,
  announcementBannerUpload.single('image'),
  createAnnouncementRules,
  validateRequest,
  createAnnouncement
);

router.put(
  '/:id',
  ...auth,
  announcementBannerUpload.single('image'),
  updateAnnouncementRules,
  validateRequest,
  updateAnnouncement
);

router.delete('/:id', protect, adminOnly, announcementIdRules, validateRequest, deleteAnnouncement);

export default router;
