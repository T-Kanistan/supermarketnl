import express from 'express';
import {
  getBanners,
  getAllBanners,
  getBannerById,
  createBanner,
  updateBanner,
  deleteBanner,
} from '../controllers/bannerController.js';
import { protect, restrictTo, adminOnly } from '../middlewares/authMiddleware.js';
import { homeBannerUpload } from '../middlewares/homeBannerUploadMiddleware.js';
import { validateRequest } from '../middlewares/validationMiddleware.js';
import {
  createHomeBannerRules,
  updateHomeBannerRules,
  homeBannerIdRules,
} from '../validators/homeBannerValidator.js';

const router = express.Router();
const auth = [protect, restrictTo('admin', 'manager')];

router.get('/', getBanners);
router.get('/all', ...auth, getAllBanners);
router.get('/:id', ...auth, homeBannerIdRules, validateRequest, getBannerById);

router.post(
  '/',
  ...auth,
  homeBannerUpload.single('image'),
  createHomeBannerRules,
  validateRequest,
  createBanner
);

router.put(
  '/:id',
  ...auth,
  homeBannerUpload.single('image'),
  updateHomeBannerRules,
  validateRequest,
  updateBanner
);

router.delete('/:id', protect, adminOnly, homeBannerIdRules, validateRequest, deleteBanner);

export default router;
