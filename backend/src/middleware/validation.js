import { body } from 'express-validator';
import { validationResult } from 'express-validator';

const requiredString = (field, label, { max = 500, min = 1 } = {}) =>
  body(field)
    .optional()
    .trim()
    .isLength({ min, max })
    .withMessage(`${label} must be between ${min} and ${max} characters`);

const requiredEmail = (field, label) =>
  body(field)
    .optional()
    .trim()
    .isEmail()
    .withMessage(`${label} must be a valid email address`);

const requiredUrl = (field, label) =>
  body(field)
    .optional()
    .trim()
    .isURL({ require_protocol: true })
    .withMessage(`${label} must be a valid URL`);

// Admins often paste the full Google Maps "<iframe ... src="...">" embed
// snippet instead of just the URL. Extract the src so we always store and
// validate a bare URL that can be used directly as an iframe source.
export const extractIframeSrc = (value) => {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  if (!trimmed) return trimmed;
  const match = trimmed.match(/<iframe[^>]*\bsrc\s*=\s*["']([^"']+)["'][^>]*>/i);
  return match ? match[1].trim() : trimmed;
};

const mapEmbedUrl = (field, label) =>
  body(field)
    .optional({ values: 'falsy' })
    .customSanitizer(extractIframeSrc)
    .trim()
    .isURL({ require_protocol: true })
    .withMessage(`${label} must be a valid URL or Google Maps embed code`);

export const updateContactSettingsRules = [
  requiredString('phoneNumber', 'Phone number', { max: 30 }),
  requiredString('phoneSubtext', 'Phone subtext', { max: 255, min: 0 }),
  requiredEmail('emailAddress', 'Email address'),
  requiredString('emailSubtext', 'Email subtext', { max: 255 }),
  requiredString('storeName', 'Store name', { max: 150 }),
  requiredString('storeAddress', 'Store address', { max: 500 }),
  requiredString('supermarketOpeningHours', 'Supermarket opening hours', { max: 100 }),
  requiredString('foodCornerOpeningHours', 'Food corner opening hours', { max: 100 }),
  requiredString('holidayNote', 'Holiday note', { max: 255 }),
  requiredString('heroBadge', 'Hero badge', { max: 100 }),
  requiredString('heroTitle', 'Hero title', { max: 150 }),
  requiredString('heroSubtitle', 'Hero subtitle', { max: 500 }),
  requiredString('heroFeature1', 'Hero feature 1', { max: 100 }),
  requiredString('heroFeature2', 'Hero feature 2', { max: 100 }),
  requiredString('heroFeature3', 'Hero feature 3', { max: 100 }),
  requiredString('formTitle', 'Form title', { max: 150 }),
  requiredString('formSubtitle', 'Form subtitle', { max: 500 }),
  requiredString('submitButtonText', 'Submit button text', { max: 100 }),
  requiredString('fullNameLabel', 'Full name label', { max: 100 }),
  requiredString('fullNamePlaceholder', 'Full name placeholder', { max: 150 }),
  requiredString('emailLabel', 'Email label', { max: 100 }),
  requiredString('emailPlaceholder', 'Email placeholder', { max: 150 }),
  requiredString('phoneLabel', 'Phone label', { max: 100 }),
  requiredString('phonePlaceholder', 'Phone placeholder', { max: 150 }),
  requiredString('subjectLabel', 'Subject label', { max: 100 }),
  requiredString('subjectPlaceholder', 'Subject placeholder', { max: 150 }),
  requiredString('messageLabel', 'Message label', { max: 100 }),
  requiredString('messagePlaceholder', 'Message placeholder', { max: 255 }),
  requiredString('privacyNote', 'Privacy note', { max: 500 }),
  requiredString('infoCardTitle', 'Info card title', { max: 150 }),
  requiredString('infoCardSubtitle', 'Info card subtitle', { max: 500 }),
  requiredString('helpBoxTitle', 'Help box title', { max: 150 }),
  requiredString('helpBoxSubtitle', 'Help box subtitle', { max: 255 }),
  mapEmbedUrl('googleMapsEmbedUrl', 'Google Maps embed URL'),
];

export const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map((err) => ({
        field: err.path || err.param,
        message: err.msg,
      })),
    });
  }
  next();
};

export default {
  updateContactSettingsRules,
  validateRequest,
};
