import express from 'express';
import { submitJobEnquiry } from '../controllers/jobEnquiryController.js';
import { validateRequest } from '../middlewares/validationMiddleware.js';
import { enquiryRateLimit } from '../middleware/enquiryRateLimit.js';
import { submitJobEnquiryRules } from '../validators/jobEnquiryValidator.js';

const router = express.Router();

router.post('/', enquiryRateLimit, submitJobEnquiryRules, validateRequest, submitJobEnquiry);

export default router;
