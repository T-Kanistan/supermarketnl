import express from 'express';
import {
  getFoodCornerCategories,
  getPublicFoodCornerCategories,
  getFoodCornerCategoryById,
  createFoodCornerCategory,
  updateFoodCornerCategory,
  toggleFoodCornerCategoryStatus,
  deleteFoodCornerCategory,
} from '../controllers/foodCornerCategoryController.js';
import { protect, adminOnly, restrictTo } from '../middlewares/authMiddleware.js';
import { validateRequest } from '../middlewares/validationMiddleware.js';
import {
  createFoodCornerCategoryRules,
  updateFoodCornerCategoryRules,
  toggleFoodCornerCategoryStatusRules,
} from '../validators/foodCornerCategoryValidator.js';

const router = express.Router();

router.get('/public/categories', getPublicFoodCornerCategories);

router.get(
  '/categories',
  protect,
  restrictTo('admin', 'manager'),
  getFoodCornerCategories
);

const catalogAuth = [protect, restrictTo('admin', 'manager')];

router.get('/categories/:id', ...catalogAuth, getFoodCornerCategoryById);

router.post(
  '/categories',
  ...catalogAuth,
  createFoodCornerCategoryRules,
  validateRequest,
  createFoodCornerCategory
);

router.put(
  '/categories/:id',
  ...catalogAuth,
  updateFoodCornerCategoryRules,
  validateRequest,
  updateFoodCornerCategory
);

router.patch(
  '/categories/:id/status',
  ...catalogAuth,
  toggleFoodCornerCategoryStatusRules,
  validateRequest,
  toggleFoodCornerCategoryStatus
);

router.delete(
  '/categories/:id',
  protect,
  adminOnly,
  deleteFoodCornerCategory
);

export default router;
