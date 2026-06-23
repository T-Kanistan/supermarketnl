import express from 'express';
import {
  getActiveHomepageAbout,
  getHomepageAboutSections,
  getHomepageAboutById,
  getHomepageAboutPreview,
  createHomepageAbout,
  updateHomepageAbout,
  deleteHomepageAbout,
  getAdminHomepageAbout,
  updateHomepageAboutLegacy,
} from '../controllers/homepageAboutController.js';
import { protect, restrictTo, adminOnly } from '../middlewares/authMiddleware.js';
import { validateRequest } from '../middlewares/validationMiddleware.js';
import { homepageAboutUpload } from '../middlewares/homepageAboutUploadMiddleware.js';
import {
  createHomepageAboutRules,
  updateHomepageAboutRules,
  updateHomepageAboutLegacyRules,
  homepageAboutIdRules,
} from '../validators/homepageAboutValidator.js';

const router = express.Router();
const auth = [protect, restrictTo('admin', 'manager')];

router.get('/active', getActiveHomepageAbout);
router.get('/admin', ...auth, getAdminHomepageAbout);
router.get('/preview/:id', ...auth, homepageAboutIdRules, validateRequest, getHomepageAboutPreview);
router.get('/', ...auth, getHomepageAboutSections);
router.get('/:id', ...auth, homepageAboutIdRules, validateRequest, getHomepageAboutById);

router.post(
  '/',
  protect,
  adminOnly,
  homepageAboutUpload.single('image'),
  createHomepageAboutRules,
  validateRequest,
  createHomepageAbout
);

router.put(
  '/',
  ...auth,
  homepageAboutUpload.single('image'),
  updateHomepageAboutLegacyRules,
  validateRequest,
  updateHomepageAboutLegacy
);

router.put(
  '/:id',
  ...auth,
  homepageAboutUpload.single('image'),
  updateHomepageAboutRules,
  validateRequest,
  updateHomepageAbout
);

router.delete('/:id', protect, adminOnly, homepageAboutIdRules, validateRequest, deleteHomepageAbout);

export default router;
