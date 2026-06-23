import { body } from 'express-validator';
import Manager from '../models/Manager.js';

const normalizeEmail = (value) => {
  if (value === undefined || value === null) return null;
  const trimmed = String(value).trim();
  return trimmed ? trimmed.toLowerCase() : null;
};

export const createManagerRules = [
  body('fullName')
    .trim()
    .notEmpty()
    .withMessage('Full name is required'),
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .custom(async (value) => {
      const email = normalizeEmail(value);
      const existing = await Manager.findOne({ email });
      if (existing) throw new Error('Email is already registered');
      return true;
    }),
  body('username')
    .trim()
    .notEmpty()
    .withMessage('Username is required')
    .isLength({ min: 3 })
    .withMessage('Username must be at least 3 characters')
    .custom(async (value) => {
      const existing = await Manager.findOne({
        username: value.toLowerCase(),
      });
      if (existing) throw new Error('Username is already taken');
      return true;
    }),
  body('phoneNumber').optional().isString(),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Passwords do not match');
      }
      return true;
    }),
  body('status').optional().isBoolean().withMessage('Status must be a boolean'),
];

export const updateManagerRules = [
  body('fullName').optional().trim().notEmpty().withMessage('Full name cannot be empty'),
  body('email')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Email cannot be empty')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .custom(async (value, { req }) => {
      const email = normalizeEmail(value);
      if (!email) return true;
      const existing = await Manager.findOne({
        email,
        _id: { $ne: req.params.id },
      });
      if (existing) throw new Error('Email is already in use');
      return true;
    }),
  body('username')
    .optional()
    .trim()
    .isLength({ min: 3 })
    .withMessage('Username must be at least 3 characters')
    .custom(async (value, { req }) => {
      if (!value) return true;
      const existing = await Manager.findOne({
        username: value.toLowerCase(),
        _id: { $ne: req.params.id },
      });
      if (existing) throw new Error('Username is already taken');
      return true;
    }),
  body('phoneNumber').optional().isString(),
  body('status').optional().isBoolean(),
  body('profileImage').optional().isString(),
];

export const managerLoginRules = [
  body('login')
    .trim()
    .notEmpty()
    .withMessage('Email or username is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

export const managerStatusRules = [
  body('status').optional().isBoolean().withMessage('Status must be a boolean'),
];
