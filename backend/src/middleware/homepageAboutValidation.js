import { body } from 'express-validator';

export const updateHomepageAboutRules = [
  body('useAboutUsContent')
    .optional()
    .isBoolean()
    .withMessage('useAboutUsContent must be a boolean'),
  body('sectionHeading').optional().isString().trim().isLength({ max: 300 }),
  body('shortDescription').optional().isString().isLength({ max: 5000 }),
  body('features').optional().isArray().withMessage('features must be an array'),
  body('features.*.text').optional().isString().trim().isLength({ max: 500 }),
  body('features.*.order').optional().isInt({ min: 0 }),
  body('buttonText').optional().isString().trim().isLength({ max: 100 }),
  body('buttonLink').optional().isString().trim().isLength({ max: 500 }),
  body('aboutImage').optional().isString(),
  body('status').optional().isIn(['Active', 'Inactive']).withMessage('status must be Active or Inactive'),
  body('isActive').optional().isBoolean(),
];
