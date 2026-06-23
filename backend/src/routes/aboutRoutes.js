import express from 'express';
import { protect, adminOnly } from '../middlewares/authMiddleware.js';
import { aboutImageUpload } from '../middleware/upload.js';
import {
  validateRequest,
  introductionRules,
  storyRules,
  timelineCreateRules,
  timelineUpdateRules,
  reorderRules,
  mongoIdRules,
  valueCreateRules,
  valueUpdateRules,
  offerCreateRules,
  offerUpdateRules,
  statisticCreateRules,
  statisticUpdateRules,
  ownerRules,
  searchQueryRules,
} from '../validators/aboutModuleValidator.js';
import {
  getPublicPage,
  getAdminPage,
  getIntroduction,
  updateIntroduction,
  uploadIntroductionImage,
  getStory,
  updateStory,
  uploadStoryImage,
  getTimeline,
  createTimeline,
  updateTimeline,
  deleteTimeline,
  reorderTimeline,
  getValues,
  createValue,
  updateValue,
  deleteValue,
  reorderValues,
  getOffers,
  createOffer,
  updateOffer,
  deleteOffer,
  uploadOfferImage,
  reorderOffers,
  getStatistics,
  createStatistic,
  updateStatistic,
  deleteStatistic,
  reorderStatistics,
  getOwner,
  updateOwner,
  uploadOwnerPhoto,
  syncAdminPage,
} from '../controllers/aboutModuleController.js';

const router = express.Router();
const admin = [protect, adminOnly];
const upload = aboutImageUpload.single('image');

router.get('/', getPublicPage);
router.get('/admin', ...admin, getAdminPage);
router.put('/admin/sync', ...admin, syncAdminPage);

router.get('/introduction', getIntroduction);
router.put('/introduction', ...admin, introductionRules, validateRequest, updateIntroduction);
router.post('/introduction/image', ...admin, upload, uploadIntroductionImage);

router.get('/story', getStory);
router.put('/story', ...admin, storyRules, validateRequest, updateStory);
router.post('/story/image', ...admin, upload, uploadStoryImage);

router.get('/story/timeline', searchQueryRules, validateRequest, getTimeline);
router.post('/story/timeline', ...admin, timelineCreateRules, validateRequest, createTimeline);
router.put('/story/timeline/reorder', ...admin, reorderRules, validateRequest, reorderTimeline);
router.put('/story/timeline/:id', ...admin, timelineUpdateRules, validateRequest, updateTimeline);
router.delete('/story/timeline/:id', ...admin, mongoIdRules, validateRequest, deleteTimeline);

router.get('/values', searchQueryRules, validateRequest, getValues);
router.post('/values', ...admin, valueCreateRules, validateRequest, createValue);
router.put('/values/reorder', ...admin, reorderRules, validateRequest, reorderValues);
router.put('/values/:id', ...admin, valueUpdateRules, validateRequest, updateValue);
router.delete('/values/:id', ...admin, mongoIdRules, validateRequest, deleteValue);

router.get('/offers', searchQueryRules, validateRequest, getOffers);
router.post('/offers', ...admin, offerCreateRules, validateRequest, createOffer);
router.put('/offers/reorder', ...admin, reorderRules, validateRequest, reorderOffers);
router.put('/offers/:id', ...admin, offerUpdateRules, validateRequest, updateOffer);
router.post('/offers/:id/image', ...admin, mongoIdRules, validateRequest, upload, uploadOfferImage);
router.delete('/offers/:id', ...admin, mongoIdRules, validateRequest, deleteOffer);

router.get('/statistics', searchQueryRules, validateRequest, getStatistics);
router.post('/statistics', ...admin, statisticCreateRules, validateRequest, createStatistic);
router.put('/statistics/reorder', ...admin, reorderRules, validateRequest, reorderStatistics);
router.put('/statistics/:id', ...admin, statisticUpdateRules, validateRequest, updateStatistic);
router.delete('/statistics/:id', ...admin, mongoIdRules, validateRequest, deleteStatistic);

router.get('/owner', getOwner);
router.put('/owner', ...admin, ownerRules, validateRequest, updateOwner);
router.post('/owner/photo', ...admin, upload, uploadOwnerPhoto);

export default router;
