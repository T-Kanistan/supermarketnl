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
import { protect, adminOnly } from '../middlewares/authMiddleware.js';
import { validateRequest } from '../middlewares/validationMiddleware.js';
import { homepageAboutUpload } from '../middlewares/homepageAboutUploadMiddleware.js';
import {
  createHomepageAboutRules,
  updateHomepageAboutRules,
  updateHomepageAboutLegacyRules,
  homepageAboutIdRules,
} from '../validators/homepageAboutValidator.js';

const router = express.Router();
const adminAuth = [protect, adminOnly];

router.get('/active', getActiveHomepageAbout);
router.get('/admin', ...adminAuth, getAdminHomepageAbout);
router.get('/preview/:id', ...adminAuth, homepageAboutIdRules, validateRequest, getHomepageAboutPreview);
router.get('/', ...adminAuth, getHomepageAboutSections);
router.get('/:id', ...adminAuth, homepageAboutIdRules, validateRequest, getHomepageAboutById);

router.post(
  '/',
  ...adminAuth,
  homepageAboutUpload.single('image'),
  createHomepageAboutRules,
  validateRequest,
  createHomepageAbout
);

router.put(
  '/',
  ...adminAuth,
  homepageAboutUpload.single('image'),
  updateHomepageAboutLegacyRules,
  validateRequest,
  updateHomepageAboutLegacy
);

router.put(
  '/:id',
  ...adminAuth,
  homepageAboutUpload.single('image'),
  updateHomepageAboutRules,
  validateRequest,
  updateHomepageAbout
);

router.delete('/:id', ...adminAuth, homepageAboutIdRules, validateRequest, deleteHomepageAbout);

export default router;
