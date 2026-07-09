import { body, param, query } from 'express-validator';
import { normalizeProductType, validateCookingTimes } from '../services/productService.js';
import { ADMIN_TEXT_LIMITS, sanitizeAdminText } from '../utils/adminTextValidation.js';

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

const groceryRules = (req) =>
  normalizeProductType(req.body.productType || req.body.type || req.body.productCatalogType) ===
  'grocery';

const resolveWeightUnit = (body) =>
  sanitizeAdminText(body.weightUnit ?? body.weightUnitSize ?? body.weight ?? '');

const assertWeightUnitForGrocery = (req, { required = false } = {}) => {
  const hasWeightField =
    req.body.weightUnit !== undefined ||
    req.body.weightUnitSize !== undefined ||
    req.body.weight !== undefined;
  const isGrocery = groceryRules(req);

  if (!isGrocery && !hasWeightField) return;

  const weightUnit = resolveWeightUnit(req.body);
  if (required && !weightUnit) {
    throw new Error('Please enter the weight or unit size.');
  }
  if (weightUnit && weightUnit.length > ADMIN_TEXT_LIMITS.weightUnit.max) {
    throw new Error(`Weight / unit size cannot exceed ${ADMIN_TEXT_LIMITS.weightUnit.max} characters.`);
  }
};

const assertGroceryDescriptionLimit = (req) => {
  if (!groceryRules(req)) return;
  if (req.body.description === undefined && req.body.shortDescription === undefined) return;
  const description = sanitizeAdminText(req.body.description ?? req.body.shortDescription ?? '', {
    collapse: false,
  });
  if (description.length > ADMIN_TEXT_LIMITS.productDescription.max) {
    throw new Error(`Description cannot exceed ${ADMIN_TEXT_LIMITS.productDescription.max} characters.`);
  }
};

const assertMenuTimingLength = (timing) => {
  const cleaned = sanitizeAdminText(timing);
  if (cleaned.length > ADMIN_TEXT_LIMITS.menuTiming.max) {
    throw new Error(`Menu display timing cannot exceed ${ADMIN_TEXT_LIMITS.menuTiming.max} characters.`);
  }
  return cleaned;
};

const isValidImageUrl = (value) => {
  if (value === undefined || value === null || value === '') return true;
  const url = String(value).trim();
  if (!url) return true;
  const imageTypeOk =
    /\.(jpe?g|png|webp)$/i.test(url) ||
    /^data:image\/(jpeg|jpg|png|webp);/i.test(url);
  if (!imageTypeOk) return false;
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
      if (required) throw new Error('Please upload a product image.');
      return true;
    }
    if (!isValidImageUrl(value)) {
      throw new Error('Only JPG, JPEG, PNG, and WEBP images are allowed.');
    }
    return true;
  });

const featuredRule = body(['showOnHomepage', 'featuredProduct', 'isFeatured', 'featured'])
  .optional({ values: 'falsy' })
  .custom((value, { req }) => {
    if (!groceryRules(req)) return true;
    if (value === undefined || value === null || value === '') return true;
    if (typeof value === 'boolean') return true;
    if (value === 'true' || value === 'false' || value === 0 || value === 1 || value === '0' || value === '1') {
      return true;
    }
    throw new Error('Featured must be a boolean value');
  });

export const createProductRules = [
  body(['productType', 'type', 'productCatalogType'])
    .notEmpty()
    .withMessage('Please select a product catalog type.'),
  body('productName')
    .optional({ values: 'falsy' })
    .trim()
    .notEmpty(),
  body('name')
    .optional({ values: 'falsy' })
    .trim()
    .notEmpty(),
  body().custom((_, { req }) => {
    const productName = sanitizeAdminText(req.body.productName || req.body.name || '');
    if (!productName) {
      throw new Error('Please enter the product name.');
    }
    if (
      productName.length < ADMIN_TEXT_LIMITS.productName.min ||
      productName.length > ADMIN_TEXT_LIMITS.productName.max
    ) {
      throw new Error('Product name must be between 2 and 100 characters.');
    }
    if (!/^[A-Za-z0-9\s\-'"&()]+$/.test(productName)) {
      throw new Error('Product name must contain only letters, numbers, spaces, hyphens, apostrophes, ampersands, and parentheses.');
    }
    return true;
  }),
  body(['categoryId', 'category', 'categoryName'])
    .custom((value, { req }) => {
      const categoryRef = value ?? req.body.categoryId ?? req.body.category ?? req.body.categoryName;
      if (!categoryRef || !String(categoryRef).trim()) {
        throw new Error('Please select a category.');
      }
      return true;
    }),
  productTypeRule,
  body('price')
    .custom((value) => {
      if (value === undefined || value === null || String(value).trim() === '') {
        throw new Error('Please enter the product price.');
      }
      const raw = String(value).trim();
      if (!/^\d+(\.\d{1,2})?$/.test(raw)) {
        throw new Error('Please enter a valid price.');
      }
      const price = Number(raw);
      if (!Number.isFinite(price)) throw new Error('Please enter a valid price.');
      if (price <= 0) throw new Error('Price must be greater than €0.');
      if (price > 9999.99) throw new Error('Please enter a valid price.');
      return true;
    }),
  body().custom((_, { req }) => {
    if (!foodCornerRules(req)) return true;
    const imageValue = req.body.imageUrl ?? req.body.image;
    if (!imageValue || !String(imageValue).trim()) {
      throw new Error('Please upload a product image.');
    }
    return true;
  }),
  imageUrlRule(false),
  body().custom((_, { req }) => {
    if (!groceryRules(req)) return true;
    const stock = req.body.stockStatus;
    if (!stock || !['in_stock', 'out_of_stock'].includes(stock)) {
      throw new Error('Please select a stock status.');
    }
    return true;
  }),
  body().custom((_, { req }) => {
    assertWeightUnitForGrocery(req, { required: true });
    assertGroceryDescriptionLimit(req);
    return true;
  }),
  body().custom((_, { req }) => {
    if (!foodCornerRules(req)) return true;
    const timing = assertMenuTimingLength(req.body.menuDisplayTiming || req.body.displayTime || '');
    if (!timing) throw new Error('Please enter the menu display time.');
    const timingMatch = timing.match(/^([0-1][0-9]):([0-5][0-9])\s?(AM|PM)\s*-\s*([0-1][0-9]):([0-5][0-9])\s?(AM|PM)$/i);
    if (!timingMatch) throw new Error('Please enter a valid time range.');
    const start = `${timingMatch[1]}:${timingMatch[2]} ${timingMatch[3].toUpperCase()}`;
    const end = `${timingMatch[4]}:${timingMatch[5]} ${timingMatch[6].toUpperCase()}`;
    validateCookingTimes(start, end);
    const description = sanitizeAdminText(req.body.description ?? req.body.shortDescription ?? '', {
      collapse: false,
    });
    if (description.length > ADMIN_TEXT_LIMITS.productDescription.max) {
      throw new Error(`Description cannot exceed ${ADMIN_TEXT_LIMITS.productDescription.max} characters.`);
    }
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
    .withMessage('Please enter the product name.')
    .isLength({ min: 2, max: 100 })
    .withMessage('Product name must be between 2 and 100 characters.')
    .matches(/^[A-Za-z0-9\s\-'"&()]+$/)
    .withMessage('Product name must contain only letters, numbers, spaces, hyphens, apostrophes, ampersands, and parentheses.'),
  body('name')
    .optional({ values: 'falsy' })
    .trim()
    .notEmpty()
    .withMessage('Please enter the product name.')
    .isLength({ min: 2, max: 100 })
    .withMessage('Product name must be between 2 and 100 characters.')
    .matches(/^[A-Za-z0-9\s\-'"&()]+$/)
    .withMessage('Product name must contain only letters, numbers, spaces, hyphens, apostrophes, ampersands, and parentheses.'),
  body(['categoryId', 'category', 'categoryName']).optional({ values: 'falsy' }),
  productTypeRule,
  body('price')
    .optional()
    .custom((value) => {
      const raw = String(value).trim();
      if (!/^\d+(\.\d{1,2})?$/.test(raw)) throw new Error('Please enter a valid price.');
      const price = Number(raw);
      if (!Number.isFinite(price) || price <= 0 || price > 9999.99) {
        throw new Error('Please enter a valid price.');
      }
      return true;
    }),
  imageUrlRule(false),
  body().custom((_, { req }) => {
    if (groceryRules(req)) {
      assertWeightUnitForGrocery(req, { required: true });
    } else {
      assertWeightUnitForGrocery(req, { required: false });
    }
    assertGroceryDescriptionLimit(req);
    return true;
  }),
  body().custom((_, { req }) => {
    if (!foodCornerRules(req)) return true;
    const mergedType = normalizeProductType(
      req.body.productType || req.body.type || req.body.productCatalogType || 'grocery'
    );
    if (mergedType !== 'food-corner') return true;

    if (req.body.menuDisplayTiming !== undefined || req.body.displayTime !== undefined) {
      const timing = assertMenuTimingLength(req.body.menuDisplayTiming ?? req.body.displayTime ?? '');
      if (!timing) throw new Error('Please enter the menu display time.');
      const timingMatch = timing.match(/^([0-1][0-9]):([0-5][0-9])\s?(AM|PM)\s*-\s*([0-1][0-9]):([0-5][0-9])\s?(AM|PM)$/i);
      if (!timingMatch) throw new Error('Please enter a valid time range.');
      const start = `${timingMatch[1]}:${timingMatch[2]} ${timingMatch[3].toUpperCase()}`;
      const end = `${timingMatch[4]}:${timingMatch[5]} ${timingMatch[6].toUpperCase()}`;
      validateCookingTimes(start, end);
    }
    if (req.body.description !== undefined || req.body.shortDescription !== undefined) {
      const description = sanitizeAdminText(req.body.description ?? req.body.shortDescription ?? '', {
        collapse: false,
      });
      if (description.length > ADMIN_TEXT_LIMITS.productDescription.max) {
        throw new Error(`Description cannot exceed ${ADMIN_TEXT_LIMITS.productDescription.max} characters.`);
      }
    }
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

export const updateProductStatusRules = [
  param('id').isMongoId().withMessage('Invalid product id'),
  body('status')
    .notEmpty()
    .withMessage('Status is required')
    .isIn(['active', 'inactive'])
    .withMessage('Status must be active or inactive'),
];

export const batchAdjustPricesRules = [
  body('productType')
    .trim()
    .notEmpty()
    .withMessage('Product type is required')
    .isIn(['grocery', 'food-corner'])
    .withMessage('Product type must be grocery or food-corner'),
  body('categoryId')
    .trim()
    .notEmpty()
    .withMessage('Category ID is required'),
  body('adjustmentType')
    .trim()
    .notEmpty()
    .withMessage('Adjustment type is required')
    .isIn(['percentage', 'fixed'])
    .withMessage('Adjustment type must be percentage or fixed'),
  body('direction')
    .trim()
    .notEmpty()
    .withMessage('Adjustment direction is required')
    .isIn(['increase', 'decrease'])
    .withMessage('Adjustment direction must be increase or decrease'),
  body('value')
    .notEmpty()
    .withMessage('Adjustment value is required')
    .isNumeric()
    .withMessage('Adjustment value must be a number')
    .custom((value) => {
      if (Number(value) <= 0) {
        throw new Error('Adjustment value must be greater than 0');
      }
      return true;
    }),
];

