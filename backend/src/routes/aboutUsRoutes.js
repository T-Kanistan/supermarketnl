import express from 'express';
import {
  getAboutUs,
  getAboutUsAdmin,
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
  uploadOfferImage,
  getStatistics,
  createStatistic,
  updateStatistic,
  deleteStatistic,
  reorderStatistics,
  getTimeline,
  createTimelineItem,
  updateTimelineItem,
  deleteTimelineItem,
  reorderTimeline,
  getMvpCards,
  createMvpCard,
  updateMvpCard,
  deleteMvpCard,
  reorderMvpCards,
} from '../controllers/aboutUsController.js';
import { protect, adminOnly } from '../middlewares/authMiddleware.js';
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
  reorderStatisticsRules,
  createTimelineRules,
  updateTimelineRules,
  timelineIdRules,
  reorderTimelineRules,
  createMvpCardRules,
  updateMvpCardRules,
  mvpCardIdRules,
  reorderMvpCardsRules,
} from '../middleware/aboutUsValidation.js';

const router = express.Router();
const adminOnlyRoutes = [protect, adminOnly];

router.get('/', getAboutUs);
router.get('/admin', ...adminOnlyRoutes, getAboutUsAdmin);
router.put('/', ...adminOnlyRoutes, updateAboutUsRules, validateRequest, updateAboutUs);

router.post('/upload/homepage-image', ...adminOnlyRoutes, aboutImageUpload.single('image'), uploadHomepageImage);
router.post('/upload/hero-image', ...adminOnlyRoutes, aboutImageUpload.single('image'), uploadHeroImage);
router.post('/upload/story-image', ...adminOnlyRoutes, aboutImageUpload.single('image'), uploadStoryImage);
router.post('/upload/owner-photo', ...adminOnlyRoutes, aboutImageUpload.single('image'), uploadOwnerPhoto);

router.get('/offers', getOffers);
router.post('/offers', ...adminOnlyRoutes, createOfferRules, validateRequest, createOffer);
router.put('/offers/reorder', ...adminOnlyRoutes, reorderOffersRules, validateRequest, reorderOffers);
router.put('/offers/:id', ...adminOnlyRoutes, updateOfferRules, validateRequest, updateOffer);
router.post('/offers/:id/image', ...adminOnlyRoutes, offerIdRules, validateRequest, aboutImageUpload.single('image'), uploadOfferImage);
router.delete('/offers/:id', ...adminOnlyRoutes, offerIdRules, validateRequest, deleteOffer);

router.get('/statistics', getStatistics);
router.post('/statistics', ...adminOnlyRoutes, createStatisticRules, validateRequest, createStatistic);
router.put('/statistics/reorder', ...adminOnlyRoutes, reorderStatisticsRules, validateRequest, reorderStatistics);
router.put('/statistics/:id', ...adminOnlyRoutes, updateStatisticRules, validateRequest, updateStatistic);
router.delete('/statistics/:id', ...adminOnlyRoutes, statisticIdRules, validateRequest, deleteStatistic);

router.get('/timeline', getTimeline);
router.post('/timeline', ...adminOnlyRoutes, createTimelineRules, validateRequest, createTimelineItem);
router.put('/timeline/reorder', ...adminOnlyRoutes, reorderTimelineRules, validateRequest, reorderTimeline);
router.put('/timeline/:id', ...adminOnlyRoutes, updateTimelineRules, validateRequest, updateTimelineItem);
router.delete('/timeline/:id', ...adminOnlyRoutes, timelineIdRules, validateRequest, deleteTimelineItem);

router.get('/mvp-cards', getMvpCards);
router.post('/mvp-cards', ...adminOnlyRoutes, createMvpCardRules, validateRequest, createMvpCard);
router.put('/mvp-cards/reorder', ...adminOnlyRoutes, reorderMvpCardsRules, validateRequest, reorderMvpCards);
router.put('/mvp-cards/:id', ...adminOnlyRoutes, updateMvpCardRules, validateRequest, updateMvpCard);
router.delete('/mvp-cards/:id', ...adminOnlyRoutes, mvpCardIdRules, validateRequest, deleteMvpCard);

export default router;
