import express from 'express';
import {
  getTestimonials,
  getAllTestimonials,
  getTestimonialById,
  createTestimonial,
  updateTestimonial,
  deleteTestimonial,
} from '../controllers/testimonialController.js';
import { protect, restrictTo } from '../middlewares/authMiddleware.js';
import { upload } from '../middlewares/uploadMiddleware.js';
import { validateRequest } from '../middlewares/validationMiddleware.js';
import { createTestimonialRules, updateTestimonialRules } from '../validators/testimonialValidator.js';

const router = express.Router();

// Public route to fetch active testimonials
router.get('/', getTestimonials);

// Protected routes to fetch all and single testimonial
router.get('/all', protect, restrictTo('admin', 'manager'), getAllTestimonials);
router.get('/:id', protect, restrictTo('admin', 'manager'), getTestimonialById);

// Protected CRUD routes
router.post(
  '/',
  protect,
  restrictTo('admin', 'manager'),
  upload.single('image'),
  createTestimonialRules,
  validateRequest,
  createTestimonial
);
router.put(
  '/:id',
  protect,
  restrictTo('admin', 'manager'),
  upload.single('image'),
  updateTestimonialRules,
  validateRequest,
  updateTestimonial
);
router.delete('/:id', protect, restrictTo('admin', 'manager'), deleteTestimonial);

export default router;
