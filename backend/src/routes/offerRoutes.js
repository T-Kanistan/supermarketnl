import express from 'express';

import {
  getOffers,
  getAllOffers,
  getFeaturedOffers,
  getOfferCategories,
  getOfferCategoriesManage,
  createOfferCategory,
  updateOfferCategory,
  updateOfferCategoryStatus,
  deleteOfferCategory,
  getOffersByCategory,
  getOfferBanner,
  updateOfferBanner,
  getOffersHeroBanners,
  getOffersHeroBannersAdmin,
  getOffersHeroBanner,
  createOffersHeroBanner,
  updateOffersHeroBanner,
  updateOffersHeroBannerStatus,
  deleteOffersHeroBanner,
  getOffer,
  createOffer,
  updateOffer,
  updateOfferStatus,
  deleteOffer,
} from '../controllers/offerController.js';
import { getOfferShareMeta } from '../controllers/offerShareController.js';

import { protect, restrictTo, adminOnly } from '../middlewares/authMiddleware.js';
import { validateRequest } from '../middlewares/validationMiddleware.js';

import {
  createOfferRules,
  updateOfferRules,
  updateOfferStatusRules,
  updateOfferBannerRules,
  createOffersHeroBannerRules,
  updateOffersHeroBannerRules,
  updateOffersHeroBannerStatusRules,
  offersHeroBannerIdRules,
  offerIdRules,
} from '../validators/offerValidator.js';

const router = express.Router();

const auth = [protect, restrictTo('admin', 'manager')];

// Public reads
router.get('/', getOffers);
router.get('/active', getOffers);
router.get('/featured', getFeaturedOffers);
router.get('/categories', getOfferCategories);
router.get('/banner', getOfferBanner);
router.get('/hero-banners', getOffersHeroBanners);

// Offer category management (admin/manager) — declared before `/category/:category`
// and `/:id` so the static segments are not shadowed by the param routes.
router.get('/categories/manage', ...auth, getOfferCategoriesManage);
router.post('/categories', protect, adminOnly, createOfferCategory);
router.patch('/categories/:id/status', ...auth, updateOfferCategoryStatus);
router.put('/categories/:id', ...auth, updateOfferCategory);
router.delete('/categories/:id', protect, adminOnly, deleteOfferCategory);

router.get('/category/:category', getOffersByCategory);

// Admin reads / banner management
router.get('/all', ...auth, getAllOffers);
router.get('/hero-banners/manage', ...auth, getOffersHeroBannersAdmin);
router.post('/hero-banners', ...auth, createOffersHeroBannerRules, validateRequest, createOffersHeroBanner);
router.get('/hero-banners/:id', ...auth, offersHeroBannerIdRules, validateRequest, getOffersHeroBanner);
router.put('/hero-banners/:id', ...auth, updateOffersHeroBannerRules, validateRequest, updateOffersHeroBanner);
router.patch('/hero-banners/:id/status', ...auth, updateOffersHeroBannerStatusRules, validateRequest, updateOffersHeroBannerStatus);
router.delete('/hero-banners/:id', protect, adminOnly, offersHeroBannerIdRules, validateRequest, deleteOffersHeroBanner);
router.put('/banner', ...auth, updateOfferBannerRules, validateRequest, updateOfferBanner);

// Public single (kept after static GET routes so they are not shadowed)
router.get('/:id/share-meta', offerIdRules, validateRequest, getOfferShareMeta);
router.get('/:id', offerIdRules, validateRequest, getOffer);

// Writes
router.post('/', protect, adminOnly, createOfferRules, validateRequest, createOffer);
router.patch('/:id/status', ...auth, updateOfferStatusRules, validateRequest, updateOfferStatus);
router.put('/:id', ...auth, updateOfferRules, validateRequest, updateOffer);
router.delete('/:id', protect, adminOnly, offerIdRules, validateRequest, deleteOffer);

export default router;
