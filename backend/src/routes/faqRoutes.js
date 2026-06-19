import express from 'express';
import {
  getFaqs,
  getAllFaqs,
  getFaqById,
  createFaq,
  updateFaq,
  deleteFaq,
  reorderFaqs,
  normalizeFaqs,
} from '../controllers/faqController.js';
import { protect, restrictTo } from '../middlewares/authMiddleware.js';
import { validateRequest } from '../middlewares/validationMiddleware.js';
import { createFaqRules, updateFaqRules } from '../validators/faqValidator.js';

const router = express.Router();

router.get('/', getFaqs);

router.get('/all', protect, restrictTo('admin', 'manager'), getAllFaqs);

router.put(
  '/normalize-order',
  protect,
  restrictTo('admin', 'manager'),
  normalizeFaqs
);

router.put(
  '/reorder',
  protect,
  restrictTo('admin', 'manager'),
  reorderFaqs
);

router.get('/:id', protect, restrictTo('admin', 'manager'), getFaqById);

router.post('/', protect, restrictTo('admin', 'manager'), createFaqRules, validateRequest, createFaq);
router.put('/:id', protect, restrictTo('admin', 'manager'), updateFaqRules, validateRequest, updateFaq);
router.delete('/:id', protect, restrictTo('admin', 'manager'), deleteFaq);

export default router;
