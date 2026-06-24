import express from 'express';
import { submitJobApplication } from '../controllers/jobApplicationController.js';
import { validateRequest } from '../middlewares/validationMiddleware.js';
import { applicationRateLimit } from '../middleware/applicationRateLimit.js';
import { submitJobApplicationRules } from '../validators/jobApplicationValidator.js';
import { handleCvUpload } from '../middlewares/jobApplicationUploadMiddleware.js';

const router = express.Router();

router.post(
  '/',
  applicationRateLimit,
  handleCvUpload,
  submitJobApplicationRules,
  validateRequest,
  submitJobApplication
);

export default router;
