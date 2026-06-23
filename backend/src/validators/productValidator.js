import { body, param, query } from 'express-validator';
import { normalizeProductType, validateCookingTimes } from '../services/productService.js';

const productTypeRule = body(['productType', 'type', 'productCatalogType'])
  .optional({ values: 'falsy' })
  .custom((value, { req }) => {
    const raw = value ?? req.body.productType ?? req.body.type ?? req.body.productCatalogType;
    if (!raw) return true;
    const normalized = normalizeProductType(raw);
    if (!['grocery', 'food-corner'].includes(normalized)) {
      throw new Error('Product type must be grocery or food-corner');
    }
    return true;
  });

const foodCornerRules = (req) =>
  normalizeProductType(req.body.productType || req.body.type || req.body.productCatalogType) ===
  'food-corner';

const isValidImageUrl = (value) => {
  if (value === undefined || value === null || value === '') return true;
  const url = String(value).trim();
  if (!url) return true;
  return (
    url.startsWith('/uploads/') ||
    url.startsWith('http://') ||
    url.startsWith('https://') ||
    url.startsWith('data:image/')
  );
};

const imageUrlRule = (required = false) =>
  body(['imageUrl', 'image']).custom((_, { req }) => {
    const value = req.body.imageUrl ?? req.body.image;
    if (!value || String(value).trim() === '') {
      if (required) throw new Error('Product image is required');
      return true;
    }
    if (!isValidImageUrl(value)) {
      throw new Error('Image URL must use /uploads/, http://, https://, or data:image/');
    }
    return true;
  });

const featuredRule = body(['featuredProduct', 'isFeatured', 'featured'])
  .optional({ values: 'falsy' })
  .custom((value) => {
    if (value === undefined || value === null || value === '') return true;
    if (typeof value === 'boolean') return true;
    if (value === 'true' || value === 'false' || value === 0 || value === 1 || value === '0' || value === '1') {
      return true;
    }
    throw new Error('Featured must be a boolean value');
  });

export const createProductRules = [
  body('productName')
    .optional({ values: 'falsy' })
    .trim()
    .notEmpty()
    .withMessage('Product name is required'),
  body('name')
    .optional({ values: 'falsy' })
    .trim()
    .notEmpty()
    .withMessage('Product name is required'),
  body().custom((_, { req }) => {
    if (!req.body.productName && !req.body.name) {
      throw new Error('Product name is required');
    }
    return true;
  }),
  body(['categoryId', 'category', 'categoryName'])
    .custom((value, { req }) => {
      const categoryRef = value ?? req.body.categoryId ?? req.body.category ?? req.body.categoryName;
      if (!categoryRef || !String(categoryRef).trim()) {
        throw new Error('Category ID is required');
      }
      return true;
    }),
  productTypeRule,
  body('price')
    .isFloat({ min: 0 })
    .withMessage('Price must be greater than or equal to 0'),
  imageUrlRule(true),
  body().custom((_, { req }) => {
    if (!foodCornerRules(req)) return true;
    const start = req.body.cookingStartTime;
    const end = req.body.cookingEndTime;
    if (start && end) validateCookingTimes(start, end);
    return true;
  }),
  featuredRule,
  body('stockStatus').optional().isIn(['in_stock', 'out_of_stock']),
  body('status').optional().isIn(['active', 'inactive']),
  body(['weightUnit', 'weightUnitSize', 'weight']).optional(),
  body(['shortDescription', 'description']).optional(),
  body('menuDisplayTiming').optional(),
];

export const updateProductRules = [
  param('id').isMongoId().withMessage('Invalid product id'),
  body('productName')
    .optional({ values: 'falsy' })
    .trim()
    .notEmpty()
    .withMessage('Product name cannot be empty'),
  body('name')
    .optional({ values: 'falsy' })
    .trim()
    .notEmpty()
    .withMessage('Product name cannot be empty'),
  body(['categoryId', 'category', 'categoryName']).optional({ values: 'falsy' }),
  productTypeRule,
  body('price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Price must be greater than or equal to 0'),
  imageUrlRule(false),
  body().custom((_, { req }) => {
    if (!foodCornerRules(req)) return true;
    const mergedType = normalizeProductType(
      req.body.productType || req.body.type || req.body.productCatalogType || 'grocery'
    );
    if (mergedType !== 'food-corner') return true;

    const start = req.body.cookingStartTime;
    const end = req.body.cookingEndTime;
    if ((start && !end) || (!start && end)) {
      throw new Error('Both cooking start time and end time are required');
    }
    if (start && end) validateCookingTimes(start, end);
    return true;
  }),
  featuredRule,
  body('stockStatus').optional().isIn(['in_stock', 'out_of_stock']),
  body('status').optional().isIn(['active', 'inactive', 'deleted']),
  body(['weightUnit', 'weightUnitSize', 'weight']).optional(),
  body(['shortDescription', 'description']).optional(),
  body('menuDisplayTiming').optional(),
];

export const productIdRules = [param('id').isMongoId().withMessage('Invalid product id')];

export const productCategoriesQueryRules = [
  query('productType')
    .notEmpty()
    .withMessage('productType query parameter is required')
    .custom((value) => {
      const normalized = normalizeProductType(value);
      if (!['grocery', 'food-corner'].includes(normalized)) {
        throw new Error('productType must be grocery or food-corner');
      }
      return true;
    }),
];
