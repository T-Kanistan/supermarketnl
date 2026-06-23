import express from 'express';
import {
  getActiveHomeBanner,
  getHomeBanners,
  getHomeBannerById,
  getHomeBannerPreview,
  createHomeBanner,
  updateHomeBanner,
  deleteHomeBanner,
} from '../controllers/homeBannerController.js';
import { protect, restrictTo, adminOnly } from '../middlewares/authMiddleware.js';
import { validateRequest } from '../middlewares/validationMiddleware.js';
import { homeBannerUpload } from '../middlewares/homeBannerUploadMiddleware.js';
import {
  createHomeBannerRules,
  updateHomeBannerRules,
  homeBannerIdRules,
} from '../validators/homeBannerValidator.js';

const router = express.Router();
const auth = [protect, restrictTo('admin', 'manager')];

router.get('/active', getActiveHomeBanner);
router.get('/preview/:id', ...auth, homeBannerIdRules, validateRequest, getHomeBannerPreview);
router.get('/', ...auth, getHomeBanners);
router.get('/:id', ...auth, homeBannerIdRules, validateRequest, getHomeBannerById);

router.post(
  '/',
  ...auth,
  homeBannerUpload.single('image'),
  createHomeBannerRules,
  validateRequest,
  createHomeBanner
);

router.put(
  '/:id',
  ...auth,
  homeBannerUpload.single('image'),
  updateHomeBannerRules,
  validateRequest,
  updateHomeBanner
);

router.delete('/:id', protect, adminOnly, homeBannerIdRules, validateRequest, deleteHomeBanner);

export default router;
