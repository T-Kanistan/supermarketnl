import express from 'express';
import {
  getProducts,
  getAllProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from '../controllers/productController.js';
import { protect, restrictTo } from '../middlewares/authMiddleware.js';
import { validateRequest } from '../middlewares/validationMiddleware.js';
import { createProductRules, updateProductRules } from '../validators/productValidator.js';

const router = express.Router();

router.get('/', getProducts);
router.get('/all', protect, restrictTo('admin', 'manager'), getAllProducts);

router.post('/', protect, restrictTo('admin', 'manager'), createProductRules, validateRequest, createProduct);
router.put('/:id', protect, restrictTo('admin', 'manager'), updateProductRules, validateRequest, updateProduct);
router.delete('/:id', protect, restrictTo('admin', 'manager'), deleteProduct);

export default router;
