import express from 'express';
import {
  getFaqs,
  getAllFaqs,
  getFaqById,
  createFaq,
  updateFaq,
  deleteFaq,
  moveFaqUp,
  moveFaqDown,
  saveFaqOrder,
  searchFaqs,
  reorderFaqs,
  getPublicFaqs,
} from '../controllers/faqController.js';
import { protect, restrictTo, adminOnly } from '../middlewares/authMiddleware.js';
import { validateRequest } from '../middlewares/validationMiddleware.js';
import {
  createFaqRules,
  updateFaqRules,
  faqIdRules,
  saveFaqOrderRules,
  searchFaqRules,
} from '../validators/faqValidator.js';

const router = express.Router();
const auth = [protect, restrictTo('admin', 'manager')];

router.get('/search', ...auth, searchFaqRules, validateRequest, searchFaqs);
router.post('/save-order', ...auth, saveFaqOrderRules, validateRequest, saveFaqOrder);

router.get('/', ...auth, getFaqs);
router.get('/all', ...auth, getAllFaqs);
router.get('/public', getPublicFaqs);

router.put('/reorder', ...auth, reorderFaqs);

router.post('/:id/move-up', ...auth, faqIdRules, validateRequest, moveFaqUp);
router.post('/:id/move-down', ...auth, faqIdRules, validateRequest, moveFaqDown);

router.get('/:id', ...auth, faqIdRules, validateRequest, getFaqById);

router.post('/', ...auth, createFaqRules, validateRequest, createFaq);
router.put('/:id', ...auth, updateFaqRules, validateRequest, updateFaq);
router.delete('/:id', protect, adminOnly, faqIdRules, validateRequest, deleteFaq);

export default router;
