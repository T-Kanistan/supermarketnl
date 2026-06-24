import express from 'express';
import {
  listBanners,
  getBannerByPage,
  getBannerById,
  createBanner,
  updateBanner,
  deleteBanner,
  updateBannerStatus,
  getBanners,
} from '../controllers/bannerController.js';
import { protect, restrictTo, adminOnly } from '../middlewares/authMiddleware.js';
import { bannerUpload } from '../middlewares/bannerUploadMiddleware.js';
import { validateRequest } from '../middlewares/validationMiddleware.js';
import {
  createBannerRules,
  updateBannerRules,
  updateBannerStatusRules,
  bannerIdRules,
  bannerPageTypeRules,
  listBannerRules,
} from '../validators/bannerValidator.js';

const router = express.Router();
const auth = [protect, restrictTo('admin', 'manager')];

router.get('/page/:pageType', bannerPageTypeRules, validateRequest, getBannerByPage);

router.get('/', ...auth, listBannerRules, validateRequest, listBanners);

router.get('/legacy/active', getBanners);

router.get('/:id', ...auth, bannerIdRules, validateRequest, getBannerById);

router.post(
  '/',
  ...auth,
  bannerUpload.single('image'),
  createBannerRules,
  validateRequest,
  createBanner
);

router.put(
  '/:id',
  ...auth,
  bannerUpload.single('image'),
  updateBannerRules,
  validateRequest,
  updateBanner
);

router.patch(
  '/:id/status',
  ...auth,
  updateBannerStatusRules,
  validateRequest,
  updateBannerStatus
);

router.delete('/:id', protect, adminOnly, bannerIdRules, validateRequest, deleteBanner);

export default router;
