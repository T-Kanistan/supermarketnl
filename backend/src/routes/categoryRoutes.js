import express from 'express';
import {
  getCategories,
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../controllers/categoryController.js';
import { protect, adminOnly, restrictTo } from '../middlewares/authMiddleware.js';
import { validateRequest } from '../middlewares/validationMiddleware.js';
import { createCategoryRules, updateCategoryRules, categoryIdRules } from '../validators/categoryValidator.js';

const router = express.Router();

router.get('/', getCategories);
router.get('/all', protect, restrictTo('admin', 'manager'), getAllCategories);

router.post('/', protect, adminOnly, createCategoryRules, validateRequest, createCategory);
router.put('/:id', protect, adminOnly, categoryIdRules, updateCategoryRules, validateRequest, updateCategory);
router.delete('/:id', protect, adminOnly, categoryIdRules, validateRequest, deleteCategory);

export default router;
