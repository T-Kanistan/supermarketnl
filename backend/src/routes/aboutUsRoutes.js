import express from 'express';
import {
  getAboutUs,
  updateAboutUs,
  uploadHomepageImage,
  uploadHeroImage,
  uploadStoryImage,
  uploadOwnerPhoto,
  getOffers,
  createOffer,
  updateOffer,
  deleteOffer,
  reorderOffers,
  getStatistics,
  createStatistic,
  updateStatistic,
  deleteStatistic,
} from '../controllers/aboutUsController.js';
import { protect, restrictTo } from '../middlewares/authMiddleware.js';
import { aboutImageUpload } from '../middleware/upload.js';
import {
  validateRequest,
  updateAboutUsRules,
  createOfferRules,
  updateOfferRules,
  offerIdRules,
  reorderOffersRules,
  createStatisticRules,
  updateStatisticRules,
  statisticIdRules,
} from '../middleware/aboutUsValidation.js';

const router = express.Router();
const adminOnly = [protect, restrictTo('admin', 'manager')];

// Public CMS
router.get('/', getAboutUs);

// Protected full CMS update
router.put('/', ...adminOnly, updateAboutUsRules, validateRequest, updateAboutUs);

// Image uploads
router.post(
  '/upload/homepage-image',
  ...adminOnly,
  aboutImageUpload.single('image'),
  uploadHomepageImage
);
router.post(
  '/upload/hero-image',
  ...adminOnly,
  aboutImageUpload.single('image'),
  uploadHeroImage
);
router.post(
  '/upload/story-image',
  ...adminOnly,
  aboutImageUpload.single('image'),
  uploadStoryImage
);
router.post(
  '/upload/owner-photo',
  ...adminOnly,
  aboutImageUpload.single('image'),
  uploadOwnerPhoto
);

// What We Offer CRUD
router.get('/offers', getOffers);
router.post('/offers', ...adminOnly, createOfferRules, validateRequest, createOffer);
router.put('/offers/reorder', ...adminOnly, reorderOffersRules, validateRequest, reorderOffers);
router.put('/offers/:id', ...adminOnly, updateOfferRules, validateRequest, updateOffer);
router.delete('/offers/:id', ...adminOnly, offerIdRules, validateRequest, deleteOffer);

// Statistics CRUD
router.get('/statistics', getStatistics);
router.post('/statistics', ...adminOnly, createStatisticRules, validateRequest, createStatistic);
router.put('/statistics/:id', ...adminOnly, updateStatisticRules, validateRequest, updateStatistic);
router.delete('/statistics/:id', ...adminOnly, statisticIdRules, validateRequest, deleteStatistic);

export default router;
