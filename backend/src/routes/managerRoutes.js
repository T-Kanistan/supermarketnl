import express from 'express';
import { protect, restrictTo } from '../middlewares/authMiddleware.js';
import { validateRequest } from '../middlewares/validationMiddleware.js';
import {
  createManagerRules,
  updateManagerRules,
  managerStatusRules,
} from '../validators/managerValidator.js';
import {
  getManagers,
  getManager,
  createManager,
  updateManager,
  deleteManager,
  updateManagerStatus,
} from '../controllers/managerController.js';

const router = express.Router();

router.use(protect, restrictTo('admin'));

router.get('/', getManagers);
router.post('/', createManagerRules, validateRequest, createManager);
router.get('/:id', getManager);
router.put('/:id', updateManagerRules, validateRequest, updateManager);
router.delete('/:id', deleteManager);
router.patch('/:id/status', managerStatusRules, validateRequest, updateManagerStatus);

export default router;
