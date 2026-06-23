import express from 'express';
import {
  getAdminVacancyStats,
  listAdminVacancies,
  getAdminVacancy,
  createAdminVacancy,
  updateAdminVacancy,
  updateAdminVacancyStatus,
  extendAdminVacancy,
  deleteAdminVacancy,
} from '../controllers/adminVacancyController.js';
import { protect, restrictTo, adminOnly } from '../middlewares/authMiddleware.js';
import { validateRequest } from '../middlewares/validationMiddleware.js';
import {
  adminVacancyListQueryRules,
  vacancyBodyRules,
  vacancyIdRules,
  vacancyStatusRules,
  vacancyExtendRules,
} from '../validators/adminVacancyValidator.js';

const router = express.Router();
const auth = [protect, restrictTo('admin', 'manager')];

router.get('/stats', ...auth, getAdminVacancyStats);
router.get('/', ...auth, adminVacancyListQueryRules, validateRequest, listAdminVacancies);
router.get('/:id', ...auth, vacancyIdRules, validateRequest, getAdminVacancy);
router.post('/', ...auth, vacancyBodyRules, validateRequest, createAdminVacancy);
router.put('/:id', ...auth, [...vacancyIdRules, ...vacancyBodyRules], validateRequest, updateAdminVacancy);
router.patch('/:id/status', ...auth, vacancyStatusRules, validateRequest, updateAdminVacancyStatus);
router.patch('/:id/extend', ...auth, vacancyExtendRules, validateRequest, extendAdminVacancy);
router.delete('/:id', protect, adminOnly, vacancyIdRules, validateRequest, deleteAdminVacancy);

export default router;
