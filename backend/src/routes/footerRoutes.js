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
import { protect, adminOnly } from '../middlewares/authMiddleware.js';
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
  adminOnly,
  updateFooterSettingsRules,
  validateRequest,
  updateSettings
);

// Logo upload & delete
router.post(
  '/upload-logo',
  protect,
  adminOnly,
  footerLogoUpload.single('footer_logo'),
  uploadLogo
);

router.delete('/logo', protect, adminOnly, deleteLogo);

// Quick links
router.get('/quick-links', getQuickLinks);
router.post(
  '/quick-links',
  protect,
  adminOnly,
  createQuickLinkRules,
  validateRequest,
  createQuickLink
);
router.put(
  '/quick-links/:id',
  protect,
  adminOnly,
  updateQuickLinkRules,
  validateRequest,
  updateQuickLink
);
router.delete(
  '/quick-links/:id',
  protect,
  adminOnly,
  quickLinkIdRules,
  validateRequest,
  deleteQuickLink
);

// Category links
router.get('/category-links', getCategoryLinks);
router.post(
  '/category-links',
  protect,
  adminOnly,
  createCategoryLinkRules,
  validateRequest,
  createCategoryLink
);
router.put(
  '/category-links/:id',
  protect,
  adminOnly,
  updateCategoryLinkRules,
  validateRequest,
  updateCategoryLink
);
router.delete(
  '/category-links/:id',
  protect,
  adminOnly,
  categoryLinkIdRules,
  validateRequest,
  deleteCategoryLink
);

// Legal links
router.get('/legal-links', getLegalLinks);
router.post(
  '/legal-links',
  protect,
  adminOnly,
  createLegalLinkRules,
  validateRequest,
  createLegalLink
);
router.put(
  '/legal-links/:id',
  protect,
  adminOnly,
  updateLegalLinkRules,
  validateRequest,
  updateLegalLink
);
router.delete(
  '/legal-links/:id',
  protect,
  adminOnly,
  legalLinkIdRules,
  validateRequest,
  deleteLegalLink
);

export default router;
