import express from 'express';
import {
  submitContactEnquiry,
  submitProductEnquiry,
  submitFoodCornerEnquiry,
} from '../controllers/enquiryController.js';
import { validateRequest } from '../middlewares/validationMiddleware.js';
import { enquiryRateLimit } from '../middleware/enquiryRateLimit.js';
import {
  contactEnquiryRules,
  productEnquiryRules,
  foodCornerEnquiryRules,
  legacySubmitMessageRules,
} from '../validators/enquiryValidator.js';

const router = express.Router();

router.post('/contact', enquiryRateLimit, contactEnquiryRules, validateRequest, submitContactEnquiry);
router.post('/product', enquiryRateLimit, productEnquiryRules, validateRequest, submitProductEnquiry);
router.post(
  '/food-corner',
  enquiryRateLimit,
  foodCornerEnquiryRules,
  validateRequest,
  submitFoodCornerEnquiry
);

// Legacy single endpoint used by older frontend integrations
router.post('/', enquiryRateLimit, legacySubmitMessageRules, validateRequest, submitContactEnquiry);

export default router;
