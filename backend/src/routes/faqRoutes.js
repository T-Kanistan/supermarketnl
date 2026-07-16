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
import { protect, adminOnly } from '../middlewares/authMiddleware.js';
import { validateRequest } from '../middlewares/validationMiddleware.js';
import {
  createFaqRules,
  updateFaqRules,
  faqIdRules,
  saveFaqOrderRules,
  searchFaqRules,
} from '../validators/faqValidator.js';

const router = express.Router();
const adminAuth = [protect, adminOnly];

router.get('/search', ...adminAuth, searchFaqRules, validateRequest, searchFaqs);
router.post('/save-order', ...adminAuth, saveFaqOrderRules, validateRequest, saveFaqOrder);

router.get('/', ...adminAuth, getFaqs);
router.get('/all', ...adminAuth, getAllFaqs);
router.get('/public', getPublicFaqs);

router.put('/reorder', ...adminAuth, reorderFaqs);

router.post('/:id/move-up', ...adminAuth, faqIdRules, validateRequest, moveFaqUp);
router.post('/:id/move-down', ...adminAuth, faqIdRules, validateRequest, moveFaqDown);

router.get('/:id', ...adminAuth, faqIdRules, validateRequest, getFaqById);

router.post('/', ...adminAuth, createFaqRules, validateRequest, createFaq);
router.put('/:id', ...adminAuth, updateFaqRules, validateRequest, updateFaq);
router.delete('/:id', ...adminAuth, faqIdRules, validateRequest, deleteFaq);

export default router;
