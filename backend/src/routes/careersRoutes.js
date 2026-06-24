import express from 'express';
import { getVacancyById } from '../controllers/vacancyController.js';
import { submitJobApplication } from '../controllers/jobApplicationController.js';
import { validateRequest } from '../middlewares/validationMiddleware.js';
import { enquiryRateLimit } from '../middleware/enquiryRateLimit.js';
import { submitJobApplicationRules } from '../validators/jobApplicationValidator.js';
import { handleCvUpload } from '../middlewares/jobApplicationUploadMiddleware.js';

const router = express.Router();

router.get('/vacancies/:id', getVacancyById);
router.post(
  '/applications',
  enquiryRateLimit,
  handleCvUpload,
  submitJobApplicationRules,
  validateRequest,
  submitJobApplication
);

export default router;
