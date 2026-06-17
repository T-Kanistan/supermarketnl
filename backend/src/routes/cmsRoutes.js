import express from 'express';
import { getCMS, updateCMS } from '../controllers/cmsController.js';
import { protect, restrictTo } from '../middlewares/authMiddleware.js';
import { upload } from '../middlewares/uploadMiddleware.js';
import { validateRequest } from '../middlewares/validationMiddleware.js';
import { updateCmsRules } from '../validators/cmsValidator.js';

const router = express.Router();

router.get('/', getCMS);
router.get('/settings', getCMS);
router.put(
  '/',
  protect,
  restrictTo('admin', 'manager'),
  upload.single('logo'),
  updateCmsRules,
  validateRequest,
  updateCMS
);
router.put(
  '/settings',
  protect,
  restrictTo('admin', 'manager'),
  upload.single('logo'),
  updateCmsRules,
  validateRequest,
  updateCMS
);

export default router;
