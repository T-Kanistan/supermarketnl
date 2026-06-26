import express from 'express';

import {
  getProducts,
  getAllProducts,
  getFeaturedProducts,
  getProductCategories,
  getProduct,
  createProduct,
  updateProduct,
  updateProductStatus,
  deleteProduct,
  productImageUpload,
  batchAdjustPrices,
} from '../controllers/productController.js';

import { protect, restrictTo, adminOnly } from '../middlewares/authMiddleware.js';
import { validateRequest } from '../middlewares/validationMiddleware.js';
import { normalizeProductRequestBody } from '../middlewares/productRequestNormalizer.js';

import {
  createProductRules,
  updateProductRules,
  updateProductStatusRules,
  productIdRules,
  productCategoriesQueryRules,
  batchAdjustPricesRules,
} from '../validators/productValidator.js';

const router = express.Router();

const auth = [protect, restrictTo('admin', 'manager')];

router.get('/', getProducts);
router.get('/featured', getFeaturedProducts);
router.get('/categories', productCategoriesQueryRules, validateRequest, getProductCategories);
router.get('/all', ...auth, getAllProducts);
router.get('/:id', productIdRules, validateRequest, getProduct);

router.post(
  '/',
  protect,
  adminOnly,
  normalizeProductRequestBody,
  createProductRules,
  validateRequest,
  createProduct
);

router.patch(
  '/:id/status',
  ...auth,
  updateProductStatusRules,
  validateRequest,
  updateProductStatus
);

router.put(
  '/:id',
  ...auth,
  normalizeProductRequestBody,
  updateProductRules,
  validateRequest,
  updateProduct
);

router.delete('/:id', protect, adminOnly, productIdRules, validateRequest, deleteProduct);

router.post(
  '/batch-adjust-prices',
  protect,
  adminOnly,
  batchAdjustPricesRules,
  validateRequest,
  batchAdjustPrices
);

export default router;
