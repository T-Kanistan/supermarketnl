import express from 'express';
import {
  getTestimonials,
  getAllTestimonials,
  getTestimonialById,
  createTestimonial,
  updateTestimonial,
  deleteTestimonial,
  searchTestimonials,
  getPublicTestimonials,
} from '../controllers/testimonialController.js';
import { protect, restrictTo, adminOnly } from '../middlewares/authMiddleware.js';
import { validateRequest } from '../middlewares/validationMiddleware.js';
import { testimonialAvatarUpload } from '../middlewares/testimonialUploadMiddleware.js';
import {
  createTestimonialRules,
  updateTestimonialRules,
  testimonialIdRules,
  searchTestimonialRules,
} from '../validators/testimonialValidator.js';

const router = express.Router();
const auth = [protect, restrictTo('admin', 'manager')];

router.get('/search', ...auth, searchTestimonialRules, validateRequest, searchTestimonials);
router.get('/public', getPublicTestimonials);

router.get('/', ...auth, getTestimonials);
router.get('/all', ...auth, getAllTestimonials);
router.get('/:id', ...auth, testimonialIdRules, validateRequest, getTestimonialById);

router.post(
  '/',
  ...auth,
  testimonialAvatarUpload.single('image'),
  createTestimonialRules,
  validateRequest,
  createTestimonial
);

router.put(
  '/:id',
  ...auth,
  testimonialAvatarUpload.single('image'),
  updateTestimonialRules,
  validateRequest,
  updateTestimonial
);

router.delete('/:id', protect, adminOnly, testimonialIdRules, validateRequest, deleteTestimonial);

export default router;
