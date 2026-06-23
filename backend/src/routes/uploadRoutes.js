import express from 'express';
import { protect, restrictTo } from '../middlewares/authMiddleware.js';
import {
  uploadProductImage,
  productImageUpload,
} from '../controllers/productController.js';
import { uploadAnnouncementBanner } from '../controllers/announcementController.js';
import { uploadHomeBannerImage } from '../controllers/homeBannerController.js';
import { uploadBannerImage } from '../controllers/bannerController.js';
import { uploadHomepageAboutImage } from '../controllers/homepageAboutController.js';
import { uploadTestimonialAvatar } from '../controllers/testimonialController.js';
import { announcementBannerUpload } from '../middlewares/announcementUploadMiddleware.js';
import { homeBannerUpload } from '../middlewares/homeBannerUploadMiddleware.js';
import { bannerUpload } from '../middlewares/bannerUploadMiddleware.js';
import { homepageAboutUpload } from '../middlewares/homepageAboutUploadMiddleware.js';
import { testimonialAvatarUpload } from '../middlewares/testimonialUploadMiddleware.js';

import { genericImageUpload, toPublicUrl } from '../middleware/upload.js';
import { successResponse } from '../utils/apiResponse.js';

const router = express.Router();

router.post(
  '/product-image',
  protect,
  restrictTo('admin', 'manager'),
  productImageUpload.single('image'),
  uploadProductImage
);

router.post(
  '/announcement-banner',
  protect,
  restrictTo('admin', 'manager'),
  announcementBannerUpload.single('image'),
  uploadAnnouncementBanner
);

router.post(
  '/home-banner',
  protect,
  restrictTo('admin', 'manager'),
  homeBannerUpload.single('image'),
  uploadHomeBannerImage
);

router.post(
  '/banner',
  protect,
  restrictTo('admin', 'manager'),
  bannerUpload.single('image'),
  uploadBannerImage
);

router.post(
  '/homepage-about',
  protect,
  restrictTo('admin', 'manager'),
  homepageAboutUpload.single('image'),
  uploadHomepageAboutImage
);

router.post(
  '/testimonial-avatar',
  protect,
  restrictTo('admin', 'manager'),
  testimonialAvatarUpload.single('image'),
  uploadTestimonialAvatar
);

router.post(
  '/image',
  protect,
  restrictTo('admin'),
  genericImageUpload.single('image'),
  (req, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'Image file is required' });
      }
      const imageUrl = toPublicUrl(req.file);
      return successResponse(res, 200, 'Image uploaded successfully', { imageUrl });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
