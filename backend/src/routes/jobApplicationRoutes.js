import express from 'express';
import {
  submitJobApplication,
  checkDuplicateJobApplication,
} from '../controllers/jobApplicationController.js';
import { validateRequest } from '../middlewares/validationMiddleware.js';
import { applicationRateLimit } from '../middleware/applicationRateLimit.js';
import {
  submitJobApplicationRules,
  checkDuplicateJobApplicationRules,
} from '../validators/jobApplicationValidator.js';
import { handleCvUpload } from '../middlewares/jobApplicationUploadMiddleware.js';

const router = express.Router();

router.post(
  '/check-duplicate',
  applicationRateLimit,
  checkDuplicateJobApplicationRules,
  validateRequest,
  checkDuplicateJobApplication
);

router.post(
  '/',
  applicationRateLimit,
  handleCvUpload,
  submitJobApplicationRules,
  validateRequest,
  submitJobApplication
);

export default router;
