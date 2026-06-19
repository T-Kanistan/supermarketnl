import express from 'express';
import {
  getSettings,
  updateSettings,
  uploadLogo,
  deleteLogo,
  getQuickLinks,
  createQuickLink,
  updateQuickLink,
  deleteQuickLink,
  getCategoryLinks,
  createCategoryLink,
  updateCategoryLink,
  deleteCategoryLink,
  getLegalLinks,
  createLegalLink,
  updateLegalLink,
  deleteLegalLink,
} from '../controllers/footerController.js';
import { protect, restrictTo } from '../middlewares/authMiddleware.js';
import { footerLogoUpload } from '../middleware/upload.js';
import {
  validateRequest,
  updateFooterSettingsRules,
  createQuickLinkRules,
  updateQuickLinkRules,
  quickLinkIdRules,
  createCategoryLinkRules,
  updateCategoryLinkRules,
  categoryLinkIdRules,
  createLegalLinkRules,
  updateLegalLinkRules,
  legalLinkIdRules,
} from '../middleware/footerValidation.js';

const router = express.Router();

// Footer settings (public read — visible links only; ?full=true for all links in settings bundle)
router.get('/settings', getSettings);

router.put(
  '/settings',
  protect,
  restrictTo('admin', 'manager'),
  updateFooterSettingsRules,
  validateRequest,
  updateSettings
);

// Logo upload & delete
router.post(
  '/upload-logo',
  protect,
  restrictTo('admin', 'manager'),
  footerLogoUpload.single('footer_logo'),
  uploadLogo
);

router.delete('/logo', protect, restrictTo('admin', 'manager'), deleteLogo);

// Quick links
router.get('/quick-links', getQuickLinks);
router.post(
  '/quick-links',
  protect,
  restrictTo('admin', 'manager'),
  createQuickLinkRules,
  validateRequest,
  createQuickLink
);
router.put(
  '/quick-links/:id',
  protect,
  restrictTo('admin', 'manager'),
  updateQuickLinkRules,
  validateRequest,
  updateQuickLink
);
router.delete(
  '/quick-links/:id',
  protect,
  restrictTo('admin', 'manager'),
  quickLinkIdRules,
  validateRequest,
  deleteQuickLink
);

// Category links
router.get('/category-links', getCategoryLinks);
router.post(
  '/category-links',
  protect,
  restrictTo('admin', 'manager'),
  createCategoryLinkRules,
  validateRequest,
  createCategoryLink
);
router.put(
  '/category-links/:id',
  protect,
  restrictTo('admin', 'manager'),
  updateCategoryLinkRules,
  validateRequest,
  updateCategoryLink
);
router.delete(
  '/category-links/:id',
  protect,
  restrictTo('admin', 'manager'),
  categoryLinkIdRules,
  validateRequest,
  deleteCategoryLink
);

// Legal links
router.get('/legal-links', getLegalLinks);
router.post(
  '/legal-links',
  protect,
  restrictTo('admin', 'manager'),
  createLegalLinkRules,
  validateRequest,
  createLegalLink
);
router.put(
  '/legal-links/:id',
  protect,
  restrictTo('admin', 'manager'),
  updateLegalLinkRules,
  validateRequest,
  updateLegalLink
);
router.delete(
  '/legal-links/:id',
  protect,
  restrictTo('admin', 'manager'),
  legalLinkIdRules,
  validateRequest,
  deleteLegalLink
);

export default router;
