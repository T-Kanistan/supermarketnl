import { body } from 'express-validator';

export const createBannerRules = [
  body('title')
    .optional()
    .trim(),
  body('highlightText')
    .optional()
    .trim(),
  body('subtitle')
    .optional()
    .trim(),
  body('buttonText')
    .optional()
    .trim(),
  body('buttonLink')
    .optional()
    .trim(),
  body('buttonText2')
    .optional()
    .trim(),
  body('buttonLink2')
    .optional()
    .trim(),
  body('status')
    .optional()
    .isIn(['active', 'inactive'])
    .withMessage('Status must be either active or inactive'),
  body('sortOrder')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Sort order must be a non-negative integer')
    .toInt(),
];

export const updateBannerRules = [
  body('title')
    .optional()
    .trim(),
  body('highlightText')
    .optional()
    .trim(),
  body('subtitle')
    .optional()
    .trim(),
  body('buttonText')
    .optional()
    .trim(),
  body('buttonLink')
    .optional()
    .trim(),
  body('buttonText2')
    .optional()
    .trim(),
  body('buttonLink2')
    .optional()
    .trim(),
  body('status')
    .optional()
    .isIn(['active', 'inactive'])
    .withMessage('Status must be either active or inactive'),
  body('sortOrder')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Sort order must be a non-negative integer')
    .toInt(),
];
