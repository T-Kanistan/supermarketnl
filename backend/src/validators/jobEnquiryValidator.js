import { body, param, query } from 'express-validator';
import { JOB_ENQUIRY_STATUSES } from '../models/JobEnquiry.js';

export const submitJobEnquiryRules = [
  body('vacancyId').trim().notEmpty().withMessage('Vacancy ID is required'),
  body('vacancyTitle').trim().notEmpty().withMessage('Vacancy position is required'),
  body('fullName')
    .trim()
    .notEmpty()
    .withMessage('Full name is required')
    .isLength({ min: 2, max: 150 })
    .withMessage('Full name must be between 2 and 150 characters'),
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('phone')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Phone number cannot be empty')
    .isLength({ max: 30 })
    .withMessage('Phone number is too long'),
  body('phoneNumber')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Phone number cannot be empty')
    .isLength({ max: 30 })
    .withMessage('Phone number is too long'),
  body().custom((_, { req }) => {
    if (req.body.phone || req.body.phoneNumber) return true;
    throw new Error('Phone number is required');
  }),
  body('message')
    .trim()
    .notEmpty()
    .withMessage('Message is required')
    .isLength({ max: 2000 })
    .withMessage('Message is too long'),
];

export const jobEnquiryIdRules = [param('id').isMongoId().withMessage('Invalid enquiry id')];

export const jobEnquiryListQueryRules = [
  query('status')
    .optional()
    .isIn(['all', ...JOB_ENQUIRY_STATUSES])
    .withMessage('Invalid status filter'),
  query('search').optional().trim().isLength({ max: 200 }),
];
