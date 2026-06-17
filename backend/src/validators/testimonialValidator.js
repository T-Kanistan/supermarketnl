import { body } from 'express-validator';

export const createTestimonialRules = [
  body('customerName')
    .trim()
    .notEmpty()
    .withMessage('Customer name is required'),
  body('rating')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be an integer between 1 and 5')
    .toInt(),
  body('review')
    .trim()
    .notEmpty()
    .withMessage('Review text is required'),
  body('status')
    .optional()
    .isIn(['active', 'inactive'])
    .withMessage('Status must be either active or inactive'),
];

export const updateTestimonialRules = [
  body('customerName')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Customer name cannot be empty'),
  body('rating')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be an integer between 1 and 5')
    .toInt(),
  body('review')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Review text cannot be empty'),
  body('status')
    .optional()
    .isIn(['active', 'inactive'])
    .withMessage('Status must be either active or inactive'),
];
