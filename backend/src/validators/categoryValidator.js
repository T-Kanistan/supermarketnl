import { body, param } from 'express-validator';

export const createCategoryRules = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Category name is required'),
  body('image')
    .optional()
    .isString()
    .withMessage('Image must be a string'),
  body('status')
    .optional()
    .isIn(['active', 'inactive'])
    .withMessage('Status must be either active or inactive'),
];

export const updateCategoryRules = [
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Category name cannot be empty'),
  body('image')
    .optional()
    .isString()
    .withMessage('Image must be a string'),
  body('status')
    .optional()
    .isIn(['active', 'inactive'])
    .withMessage('Status must be either active or inactive'),
];

export const categoryIdRules = [
  param('id')
    .trim()
    .notEmpty()
    .withMessage('Category identifier is required')
    .custom((value) => {
      const isValidMongoId = /^[0-9a-fA-F]{24}$/.test(value);
      const isValidSlug = /^[a-z0-9-]+$/.test(value);
      if (!isValidMongoId && !isValidSlug) {
        throw new Error('Invalid category identifier (must be a valid Mongo ID or slug)');
      }
      return true;
    }),
];
