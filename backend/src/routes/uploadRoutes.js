import express from 'express';
import { protect, restrictTo } from '../middlewares/authMiddleware.js';
import {
  uploadProductImage,
  productImageUpload,
} from '../controllers/productController.js';
import { uploadAnnouncementBanner } from '../controllers/announcementController.js';
import { uploadHomeBannerImage } from '../controllers/homeBannerController.js';
import { uploadHomepageAboutImage } from '../controllers/homepageAboutController.js';
import { uploadTestimonialAvatar } from '../controllers/testimonialController.js';
import { announcementBannerUpload } from '../middlewares/announcementUploadMiddleware.js';
import { homeBannerUpload } from '../middlewares/homeBannerUploadMiddleware.js';
import { homepageAboutUpload } from '../middlewares/homepageAboutUploadMiddleware.js';
import { testimonialAvatarUpload } from '../middlewares/testimonialUploadMiddleware.js';

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

export default router;
