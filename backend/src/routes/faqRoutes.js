import express from 'express';
import {
  getFaqs,
  getAllFaqs,
  getFaqById,
  createFaq,
  updateFaq,
  deleteFaq,
} from '../controllers/faqController.js';
import { protect, restrictTo } from '../middlewares/authMiddleware.js';
import { validateRequest } from '../middlewares/validationMiddleware.js';
import { createFaqRules, updateFaqRules } from '../validators/faqValidator.js';

const router = express.Router();

// Public route to fetch active FAQs
router.get('/', getFaqs);

// Protected routes to fetch all and single FAQ
router.get('/all', protect, restrictTo('admin', 'manager'), getAllFaqs);
router.get('/:id', protect, restrictTo('admin', 'manager'), getFaqById);

// Protected CRUD routes
router.post('/', protect, restrictTo('admin', 'manager'), createFaqRules, validateRequest, createFaq);
router.put('/:id', protect, restrictTo('admin', 'manager'), updateFaqRules, validateRequest, updateFaq);
router.delete('/:id', protect, restrictTo('admin', 'manager'), deleteFaq);

export default router;
