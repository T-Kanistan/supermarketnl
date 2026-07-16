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
import { createCategoryRules, updateCategoryRules, categoryIdRules } from '../validators/categoryValidator.js';

const router = express.Router();
const auth = [protect, restrictTo('admin', 'manager')];

router.get('/', getCategories);
router.get('/all', ...auth, getAllCategories);

router.post('/', ...auth, createCategoryRules, validateRequest, createCategory);
router.put('/:id', ...auth, categoryIdRules, updateCategoryRules, validateRequest, updateCategory);
router.delete('/:id', ...auth, categoryIdRules, validateRequest, deleteCategory);

export default router;
