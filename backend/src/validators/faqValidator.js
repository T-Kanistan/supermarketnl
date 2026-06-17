import { body } from 'express-validator';

export const createFaqRules = [
  body('question')
    .trim()
    .notEmpty()
    .withMessage('Question is required'),
  body('answer')
    .trim()
    .notEmpty()
    .withMessage('Answer is required'),
  body('status')
    .optional()
    .isIn(['active', 'inactive'])
    .withMessage('Status must be either active or inactive'),
];

export const updateFaqRules = [
  body('question')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Question cannot be empty'),
  body('answer')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Answer cannot be empty'),
  body('status')
    .optional()
    .isIn(['active', 'inactive'])
    .withMessage('Status must be either active or inactive'),
];
