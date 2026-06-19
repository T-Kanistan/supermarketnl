import express from 'express';
import {
  getHomepageAbout,
  getAdminHomepageAbout,
  updateHomepageAbout,
  uploadHomepageAboutImage,
} from '../controllers/homepageAboutController.js';
import { protect, restrictTo } from '../middlewares/authMiddleware.js';
import { homepageAboutImageUpload } from '../middleware/upload.js';
import {
  updateHomepageAboutRules,
} from '../middleware/homepageAboutValidation.js';
import { validateRequest } from '../middleware/aboutUsValidation.js';

const router = express.Router();
const adminOnly = [protect, restrictTo('admin', 'manager')];

router.get('/', getHomepageAbout);

router.get('/admin', ...adminOnly, getAdminHomepageAbout);

router.put('/', ...adminOnly, updateHomepageAboutRules, validateRequest, updateHomepageAbout);

router.post(
  '/upload-image',
  ...adminOnly,
  homepageAboutImageUpload.single('image'),
  uploadHomepageAboutImage
);

export default router;
