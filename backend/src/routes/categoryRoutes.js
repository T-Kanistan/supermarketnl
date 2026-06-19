import express from 'express';
import {
  getCategories,
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../controllers/categoryController.js';
import { protect, restrictTo } from '../middlewares/authMiddleware.js';
import { validateRequest } from '../middlewares/validationMiddleware.js';
import { createCategoryRules, updateCategoryRules } from '../validators/categoryValidator.js';

const router = express.Router();

router.get('/', getCategories);
router.get('/all', protect, restrictTo('admin', 'manager'), getAllCategories);

router.post('/', protect, restrictTo('admin', 'manager'), createCategoryRules, validateRequest, createCategory);
router.put('/:id', protect, restrictTo('admin', 'manager'), updateCategoryRules, validateRequest, updateCategory);
router.delete('/:id', protect, restrictTo('admin', 'manager'), deleteCategory);

export default router;
