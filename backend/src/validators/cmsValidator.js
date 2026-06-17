import { body } from 'express-validator';

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
    .notEmpty()
    .withMessage('Contact phone cannot be empty'),
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
];
