import express from 'express';
import {
  getBanners,
  getAllBanners,
  getBannerById,
  createBanner,
  updateBanner,
  deleteBanner,
} from '../controllers/bannerController.js';
import { protect, restrictTo } from '../middlewares/authMiddleware.js';
import { upload } from '../middlewares/uploadMiddleware.js';
import { validateRequest } from '../middlewares/validationMiddleware.js';
import { createBannerRules, updateBannerRules } from '../validators/bannerValidator.js';

const router = express.Router();

// Public route to fetch active banners
router.get('/', getBanners);

// Protected routes to fetch all banners and single banner
router.get('/all', protect, restrictTo('admin', 'manager'), getAllBanners);
router.get('/:id', protect, restrictTo('admin', 'manager'), getBannerById);

// Protected CRUD routes
router.post(
  '/',
  protect,
  restrictTo('admin', 'manager'),
  upload.single('image'),
  createBannerRules,
  validateRequest,
  createBanner
);
router.put(
  '/:id',
  protect,
  restrictTo('admin', 'manager'),
  upload.single('image'),
  updateBannerRules,
  validateRequest,
  updateBanner
);
router.delete('/:id', protect, restrictTo('admin', 'manager'), deleteBanner);

export default router;
