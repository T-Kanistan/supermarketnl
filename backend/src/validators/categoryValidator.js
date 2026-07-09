import { body, param } from 'express-validator';
import { ADMIN_TEXT_LIMITS, expressTextValidator } from '../utils/adminTextValidation.js';

const { min, max } = ADMIN_TEXT_LIMITS.categoryName;

const isValidCategoryImage = (value) => {
  if (!value || String(value).trim() === '') return false;
  const url = String(value).trim();
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

const categoryImageRule = (required = false) =>
  body('image').custom((value) => {
    if (!value || String(value).trim() === '') {
      if (required) throw new Error('Please upload a category image.');
      return true;
    }
    if (!isValidCategoryImage(value)) {
      throw new Error('Only JPG, JPEG, PNG, and WEBP images are allowed.');
    }
    return true;
  });

const categoryNameRule = (required = true) => {
  let rule = body('name').trim();
  if (!required) {
    rule = rule.optional({ values: 'falsy' });
  }
  return rule.custom(
    expressTextValidator({
      required,
      min,
      max,
      requiredMessage: 'Please enter a category name.',
      rangeMessage: 'Category name must be between 2 and 50 characters.',
      maxMessage: 'Category name must be between 2 and 50 characters.',
    })
  );
};

export const createCategoryRules = [
  categoryNameRule(true),
  categoryImageRule(true),
  body('status')
    .optional()
    .isIn(['active', 'inactive'])
    .withMessage('Status must be either active or inactive'),
];

export const updateCategoryRules = [
  categoryNameRule(false),
  categoryImageRule(false),
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
