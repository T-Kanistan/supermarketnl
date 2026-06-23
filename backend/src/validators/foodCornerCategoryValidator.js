import { body } from 'express-validator';

const categoryNameRule = (optional = false) => {
  const rule = body('categoryName').trim();
  if (optional) {
    return rule.optional().notEmpty().withMessage('Category name cannot be empty');
  }
  return rule.notEmpty().withMessage('Category name is required');
};

export const createFoodCornerCategoryRules = [
  categoryNameRule(),
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Category name cannot be empty'),
  body('slug')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Category slug cannot be empty'),
  body('icon')
    .optional()
    .isString()
    .withMessage('Icon must be a string'),
  body('description')
    .optional()
    .isString()
    .withMessage('Description must be a string'),
  body('displayOrder')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Display order must be a non-negative integer'),
  body('status')
    .optional()
    .isBoolean()
    .withMessage('Status must be a boolean'),
];

export const updateFoodCornerCategoryRules = [
  categoryNameRule(true),
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Category name cannot be empty'),
  body('slug')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Category slug cannot be empty'),
  body('icon')
    .optional()
    .isString()
    .withMessage('Icon must be a string'),
  body('description')
    .optional()
    .isString()
    .withMessage('Description must be a string'),
  body('displayOrder')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Display order must be a non-negative integer'),
  body('status')
    .optional()
    .isBoolean()
    .withMessage('Status must be a boolean'),
];

export const toggleFoodCornerCategoryStatusRules = [
  body('status')
    .optional()
    .isBoolean()
    .withMessage('Status must be a boolean'),
];
