import { body, param, query } from 'express-validator';
import { APPLICATION_STATUSES } from '../models/JobApplication.js';

const PHONE_PATTERN = /^[\d\s+().-]{7,30}$/;

export const submitJobApplicationRules = [
  body('jobId')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Job ID cannot be empty'),
  body('vacancyId')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Vacancy ID cannot be empty'),
  body().custom((_, { req }) => {
    if (req.body.jobId || req.body.vacancyId) return true;
    throw new Error('Vacancy ID is required');
  }),
  body('jobTitle')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Job title cannot be empty'),
  body('vacancyTitle')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Vacancy title cannot be empty'),
  body().custom((_, { req }) => {
    if (req.body.jobTitle || req.body.vacancyTitle) return true;
    throw new Error('Vacancy title is required');
  }),
  body('department').optional().trim().isLength({ max: 120 }).withMessage('Department is too long'),
  body('employmentType')
    .optional()
    .trim()
    .isLength({ max: 120 })
    .withMessage('Employment type is too long'),
  body('location').optional().trim().isLength({ max: 200 }).withMessage('Location is too long'),
  body('firstName')
    .trim()
    .notEmpty()
    .withMessage('First name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('First name must be between 2 and 100 characters'),
  body('lastName')
    .trim()
    .notEmpty()
    .withMessage('Last name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Last name must be between 2 and 100 characters'),
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('phoneNumber')
    .trim()
    .notEmpty()
    .withMessage('Phone number is required')
    .matches(PHONE_PATTERN)
    .withMessage('Please provide a valid phone number')
    .isLength({ max: 30 })
    .withMessage('Phone number is too long'),
  body('address')
    .trim()
    .notEmpty()
    .withMessage('Address is required')
    .isLength({ max: 500 })
    .withMessage('Address is too long'),
];

export const jobApplicationIdRules = [
  param('id').isMongoId().withMessage('Invalid application id'),
];

export const jobApplicationStatusRules = [
  ...jobApplicationIdRules,
  body('status')
    .trim()
    .notEmpty()
    .withMessage('Status is required')
    .isIn(APPLICATION_STATUSES)
    .withMessage('Invalid application status'),
];

export const jobApplicationListQueryRules = [
  query('status')
    .optional()
    .isIn(['all', ...APPLICATION_STATUSES])
    .withMessage('Invalid status filter'),
  query('search').optional().trim().isLength({ max: 200 }),
  query('vacancyId').optional().trim().isLength({ max: 100 }),
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
];

export const recentApplicationsQueryRules = [
  query('limit').optional().isInt({ min: 1, max: 50 }).toInt(),
];
