import { body } from 'express-validator';

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
