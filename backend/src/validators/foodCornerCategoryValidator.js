import { body, param } from 'express-validator';
import {
  assertFoodCornerCategoryIcon,
} from '../utils/foodCornerCategoryIconValidation.js';

const categoryNameRule = (optional = false) => {
  const rule = body('categoryName').trim();
  if (optional) {
    return rule.optional().notEmpty().withMessage('Please enter a category name.');
  }
  return rule.notEmpty().withMessage('Please enter a category name.');
};

const slugRule = (optional = false) => {
  const rule = body('slug').trim();
  if (optional) {
    return rule.optional().notEmpty().withMessage('Please enter a category slug.');
  }
  return rule.notEmpty().withMessage('Please enter a category slug.');
};

const iconRule = (required = false) =>
  body('icon').custom((value) => {
    if (!value || !String(value).trim()) {
      if (required) throw new Error('Please upload a category icon.');
      return true;
    }
    assertFoodCornerCategoryIcon(value, { required });
    return true;
  });

export const createFoodCornerCategoryRules = [
  categoryNameRule(),
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Please enter a category name.'),
  slugRule(),
  iconRule(true),
  body('description')
    .optional()
    .isString()
    .withMessage('Description must be a string'),
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
    .withMessage('Please enter a category name.'),
  slugRule(true),
  body('icon').custom((value) => {
    if (value === undefined) return true;
    if (!value || !String(value).trim()) {
      throw new Error('Please upload a category icon.');
    }
    assertFoodCornerCategoryIcon(value, { required: true });
    return true;
  }),
  body('description')
    .optional()
    .isString()
    .withMessage('Description must be a string'),
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

export const foodCornerCategoryIdRules = [
  param('id').isMongoId().withMessage('Invalid food corner category id'),
];
