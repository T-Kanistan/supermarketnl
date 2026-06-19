import { body } from 'express-validator';

export const createFaqRules = [
  body('question').trim().notEmpty().withMessage('Question is required'),
  body('answer').trim().notEmpty().withMessage('Answer is required'),
  body('status')
    .optional()
    .isIn(['active', 'inactive'])
    .withMessage('Status must be either active or inactive'),
];

export const updateFaqRules = [
  body('question').optional().trim().notEmpty().withMessage('Question cannot be empty'),
  body('answer').optional().trim().notEmpty().withMessage('Answer cannot be empty'),
  body('status')
    .optional()
    .isIn(['active', 'inactive'])
    .withMessage('Status must be either active or inactive'),
  body('order').optional().isInt({ min: 0 }).withMessage('Order must be a non-negative integer'),
];

export const reorderFaqRules = [
  body().isArray({ min: 1 }).withMessage('Request body must be a non-empty array'),
  body('*.id').isMongoId().withMessage('Each item requires a valid id'),
  body('*.order').isInt({ min: 0 }).withMessage('Each item requires a valid order'),
];
