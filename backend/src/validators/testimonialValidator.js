import { body, param, query } from 'express-validator';

const mapLegacyFields = body().custom((_, { req }) => {
  if (!req.body.avatarImage && req.body.image) {
    req.body.avatarImage = req.body.image;
  }
  return true;
});

export const createTestimonialRules = [
  mapLegacyFields,
  body('customerName')
    .trim()
    .notEmpty()
    .withMessage('Customer name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Customer name must be between 2 and 100 characters'),
  body('rating')
    .notEmpty()
    .withMessage('Rating is required')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be an integer between 1 and 5')
    .toInt(),
  body('review')
    .trim()
    .notEmpty()
    .withMessage('Review text is required')
    .isLength({ min: 20, max: 1000 })
    .withMessage('Review must be between 20 and 1000 characters'),
  body('status')
    .notEmpty()
    .withMessage('Status is required')
    .isIn(['active', 'inactive'])
    .withMessage('Status must be active or inactive'),
  body('avatarImage').optional().isString(),
  body('image').optional().isString(),
];

export const updateTestimonialRules = [
  param('id').isMongoId().withMessage('Invalid testimonial id'),
  mapLegacyFields,
  body('customerName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Customer name must be between 2 and 100 characters'),
  body('rating')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be an integer between 1 and 5')
    .toInt(),
  body('review')
    .optional()
    .trim()
    .isLength({ min: 20, max: 1000 })
    .withMessage('Review must be between 20 and 1000 characters'),
  body('status')
    .optional()
    .isIn(['active', 'inactive'])
    .withMessage('Status must be active or inactive'),
  body('avatarImage').optional().isString(),
  body('image').optional().isString(),
];

export const testimonialIdRules = [param('id').isMongoId().withMessage('Invalid testimonial id')];

export const searchTestimonialRules = [
  query('q').optional().trim().isLength({ min: 1, max: 200 }),
  query('search').optional().trim().isLength({ min: 1, max: 200 }),
];
