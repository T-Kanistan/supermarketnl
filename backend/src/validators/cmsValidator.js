import { body } from 'express-validator';
import {
  PHONE_INVALID,
  PHONE_REQUIRED,
  validateContactPhone,
} from '../utils/contactInfoValidation.js';

export const updateCmsRules = [
  body('storeName')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Store name cannot be empty'),
  body('contactEmail')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email address'),
  body('contactPhone')
    .optional()
    .trim()
    .custom((value) => {
      if (value === undefined || value === null) return true;
      const trimmed = String(value).trim();
      if (!trimmed) throw new Error(PHONE_REQUIRED);
      const error = validateContactPhone(trimmed);
      if (error) throw new Error(error.message || PHONE_INVALID);
      return true;
    }),
  body('address')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Address cannot be empty'),
  body('aboutUs')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('About Us content cannot be empty'),
  body('footerDescription')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Footer description cannot be empty'),
  body('facebook')
    .optional()
    .trim(),
  body('instagram')
    .optional()
    .trim(),
  body('whatsapp')
    .optional()
    .trim(),
  body('youtube')
    .optional()
    .trim(),
  body('tiktok')
    .optional()
    .trim(),
  body('supermarketTimings')
    .optional()
    .trim(),
  body('foodCornerTimings')
    .optional()
    .trim(),
];
