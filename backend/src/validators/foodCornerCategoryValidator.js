import { body, param } from 'express-validator';
import {
  assertFoodCornerCategoryIcon,
  FOOD_CORNER_CATEGORY_NAME_MAX,
  FOOD_CORNER_CATEGORY_NAME_MIN,
  FOOD_CORNER_CATEGORY_NAME_MAX_ERROR,
  FOOD_CORNER_CATEGORY_NAME_MIN_ERROR,
  FOOD_CORNER_CATEGORY_SLUG_MAX,
  FOOD_CORNER_CATEGORY_SLUG_PATTERN,
  FOOD_CORNER_CATEGORY_SLUG_PATTERN_ERROR,
  FOOD_CORNER_CATEGORY_SLUG_MAX_ERROR,
} from '../utils/foodCornerCategoryIconValidation.js';

const categoryNameRule = (optional = false) => {
  let rule = body('categoryName').trim();
  if (optional) {
    rule = rule.optional();
  }
  return rule
    .notEmpty()
    .withMessage('Please enter a category name.')
    .isLength({ min: FOOD_CORNER_CATEGORY_NAME_MIN })
    .withMessage(FOOD_CORNER_CATEGORY_NAME_MIN_ERROR)
    .isLength({ max: FOOD_CORNER_CATEGORY_NAME_MAX })
    .withMessage(FOOD_CORNER_CATEGORY_NAME_MAX_ERROR);
};

const slugRule = (optional = false) => {
  let rule = body('slug').trim();
  if (optional) {
    rule = rule.optional();
  }
  return rule
    .notEmpty()
    .withMessage('Please enter a category slug.')
    .isLength({ max: FOOD_CORNER_CATEGORY_SLUG_MAX })
    .withMessage(FOOD_CORNER_CATEGORY_SLUG_MAX_ERROR)
    .matches(FOOD_CORNER_CATEGORY_SLUG_PATTERN)
    .withMessage(FOOD_CORNER_CATEGORY_SLUG_PATTERN_ERROR);
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
    .withMessage('Please enter a category name.')
    .isLength({ min: FOOD_CORNER_CATEGORY_NAME_MIN })
    .withMessage(FOOD_CORNER_CATEGORY_NAME_MIN_ERROR)
    .isLength({ max: FOOD_CORNER_CATEGORY_NAME_MAX })
    .withMessage(FOOD_CORNER_CATEGORY_NAME_MAX_ERROR),
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
    .withMessage('Please enter a category name.')
    .isLength({ min: FOOD_CORNER_CATEGORY_NAME_MIN })
    .withMessage(FOOD_CORNER_CATEGORY_NAME_MIN_ERROR)
    .isLength({ max: FOOD_CORNER_CATEGORY_NAME_MAX })
    .withMessage(FOOD_CORNER_CATEGORY_NAME_MAX_ERROR),
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
