import express from 'express';
import {
  getJobApplications,
  getJobApplication,
  updateApplicationStatus,
  removeJobApplication,
  downloadApplicationCv,
} from '../controllers/jobApplicationController.js';
import { protect, restrictTo, adminOnly } from '../middlewares/authMiddleware.js';
import { validateRequest } from '../middlewares/validationMiddleware.js';
import {
  jobApplicationIdRules,
  jobApplicationStatusRules,
  jobApplicationListQueryRules,
} from '../validators/jobApplicationValidator.js';

const router = express.Router();
const auth = [protect, restrictTo('admin', 'manager')];

router.get('/', ...auth, jobApplicationListQueryRules, validateRequest, getJobApplications);
router.get('/:id/download-cv', ...auth, jobApplicationIdRules, validateRequest, downloadApplicationCv);
router.get('/:id', ...auth, jobApplicationIdRules, validateRequest, getJobApplication);
router.patch('/:id/status', ...auth, jobApplicationStatusRules, validateRequest, updateApplicationStatus);
router.delete('/:id', protect, adminOnly, jobApplicationIdRules, validateRequest, removeJobApplication);

export default router;
