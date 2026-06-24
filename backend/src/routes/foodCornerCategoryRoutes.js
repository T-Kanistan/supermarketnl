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
  foodCornerCategoryIdRules,
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

router.get('/categories/:id', ...catalogAuth, foodCornerCategoryIdRules, validateRequest, getFoodCornerCategoryById);

router.post(
  '/categories',
  protect,
  adminOnly,
  createFoodCornerCategoryRules,
  validateRequest,
  createFoodCornerCategory
);

router.put(
  '/categories/:id',
  protect,
  adminOnly,
  foodCornerCategoryIdRules,
  updateFoodCornerCategoryRules,
  validateRequest,
  updateFoodCornerCategory
);

router.patch(
  '/categories/:id/status',
  protect,
  adminOnly,
  foodCornerCategoryIdRules,
  toggleFoodCornerCategoryStatusRules,
  validateRequest,
  toggleFoodCornerCategoryStatus
);

router.delete(
  '/categories/:id',
  protect,
  adminOnly,
  foodCornerCategoryIdRules,
  validateRequest,
  deleteFoodCornerCategory
);

export default router;
