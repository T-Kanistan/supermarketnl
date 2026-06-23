import express from 'express';
import {
  listBanners,
  getBannerByPage,
  getBannerById,
  createBanner,
  updateBanner,
  deleteBanner,
  getBanners,
} from '../controllers/bannerController.js';
import { protect, restrictTo, adminOnly } from '../middlewares/authMiddleware.js';
import { bannerUpload } from '../middlewares/bannerUploadMiddleware.js';
import { validateRequest } from '../middlewares/validationMiddleware.js';
import {
  createBannerRules,
  updateBannerRules,
  bannerIdRules,
  bannerPageNameRules,
  listBannerRules,
} from '../validators/bannerValidator.js';

const router = express.Router();
const auth = [protect, restrictTo('admin', 'manager')];

router.get('/page/:pageName', bannerPageNameRules, validateRequest, getBannerByPage);

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

router.delete('/:id', protect, adminOnly, bannerIdRules, validateRequest, deleteBanner);

export default router;
