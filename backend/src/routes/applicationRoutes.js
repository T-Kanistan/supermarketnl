import express from 'express';
import { submitJobApplication } from '../controllers/jobApplicationController.js';
import { validateRequest } from '../middlewares/validationMiddleware.js';
import { applicationRateLimit } from '../middleware/applicationRateLimit.js';
import { submitJobApplicationRules } from '../validators/jobApplicationValidator.js';
import { jobApplicationCvUpload } from '../middlewares/jobApplicationUploadMiddleware.js';

const router = express.Router();

const handleCvUpload = (req, res, next) => {
  jobApplicationCvUpload.single('cv')(req, res, (err) => {
    if (!err) return next();
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'CV file must be less than 2MB',
      });
    }
    if (err.message === 'Only PDF, DOC, and DOCX files are allowed') {
      return res.status(400).json({
        success: false,
        message: 'Only PDF, DOC, and DOCX files are allowed',
      });
    }
    return next(err);
  });
};

router.post(
  '/apply',
  applicationRateLimit,
  handleCvUpload,
  submitJobApplicationRules,
  validateRequest,
  submitJobApplication
);

export default router;
