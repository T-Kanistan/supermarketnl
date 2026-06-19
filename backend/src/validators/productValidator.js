import { body } from 'express-validator';

export const createProductRules = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Product name is required'),
  body('categoryId')
    .trim()
    .notEmpty()
    .withMessage('Category is required'),
  body('type')
    .optional()
    .isIn(['grocery', 'food'])
    .withMessage('Type must be grocery or food'),
  body('price')
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  body('oldPrice')
    .optional({ nullable: true })
    .isFloat({ min: 0 })
    .withMessage('Old price must be a positive number'),
  body('stock')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Stock must be zero or greater'),
  body('status')
    .optional()
    .isIn(['active', 'inactive'])
    .withMessage('Status must be either active or inactive'),
  body('isFeatured')
    .optional()
    .isBoolean()
    .withMessage('isFeatured must be a boolean'),
];

export const updateProductRules = [
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Product name cannot be empty'),
  body('categoryId')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Category cannot be empty'),
  body('type')
    .optional()
    .isIn(['grocery', 'food'])
    .withMessage('Type must be grocery or food'),
  body('price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  body('oldPrice')
    .optional({ nullable: true })
    .isFloat({ min: 0 })
    .withMessage('Old price must be a positive number'),
  body('stock')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Stock must be zero or greater'),
  body('status')
    .optional()
    .isIn(['active', 'inactive'])
    .withMessage('Status must be either active or inactive'),
  body('isFeatured')
    .optional()
    .isBoolean()
    .withMessage('isFeatured must be a boolean'),
];
