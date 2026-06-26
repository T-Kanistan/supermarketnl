import { body } from 'express-validator';

const mapLegacyPasswordFields = body().custom((_, { req }) => {
  if (!req.body.currentPassword && req.body.oldPassword) {
    req.body.currentPassword = req.body.oldPassword;
  }
  return true;
});

export const changeAccountPasswordRules = [
  mapLegacyPasswordFields,
  body('currentPassword')
    .optional()
    .notEmpty()
    .withMessage('Current password is required'),
  body('oldPassword')
    .optional()
    .notEmpty()
    .withMessage('Current password is required'),
  body().custom((_, { req }) => {
    if (!req.body.currentPassword && !req.body.oldPassword) {
      throw new Error('Current password is required');
    }
    return true;
  }),
  body('newPassword')
    .notEmpty()
    .withMessage('New password is required')
    .isLength({ min: 6, max: 50 })
    .withMessage('New password must be between 6 and 50 characters')
    .custom((value, { req }) => {
      const current = req.body.currentPassword || req.body.oldPassword;
      if (current && value === current) {
        throw new Error('New password must not match current password');
      }
      return true;
    }),
  body('confirmPassword')
    .notEmpty()
    .withMessage('Confirm password is required')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('New password and confirm password do not match');
      }
      return true;
    }),
];

export const updateAccountProfileRules = [
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Name is required'),
  body('fullName')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Full name is required'),
  body('email')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Invalid email address')
    .normalizeEmail(),
];
