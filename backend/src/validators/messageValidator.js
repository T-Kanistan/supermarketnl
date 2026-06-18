import { body } from 'express-validator';

export const submitMessageRules = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required'),
  body('email')
    .optional({ values: 'falsy' })
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email address'),
  body('phone')
    .optional({ values: 'falsy' })
    .trim()
    .notEmpty()
    .withMessage('Phone number cannot be empty when provided'),
  body('subject')
    .trim()
    .notEmpty()
    .withMessage('Subject is required'),
  body('message')
    .trim()
    .notEmpty()
    .withMessage('Message is required'),
];

export const markMessageReadRules = [
  body('isRead')
    .isBoolean()
    .withMessage('isRead must be a boolean'),
];
