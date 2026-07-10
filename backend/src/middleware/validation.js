import { body } from 'express-validator';
import { validationResult } from 'express-validator';
import {
  validateContactPhone,
  validateContactEmail,
} from '../utils/contactInfoValidation.js';
import { ADMIN_TEXT_LIMITS } from '../utils/adminTextValidation.js';

const {
  storeName: storeNameLimit,
  storeAddress: storeAddressLimit,
  emailSubtext: emailSubtextLimit,
  phoneSubtext: phoneSubtextLimit,
  contactHeroBadge,
  contactHeroTitle,
  contactHeroSubtitle,
  contactHeroFeature,
  contactFormLabel,
  contactPlaceholder,
  contactPrivacyNote,
} = ADMIN_TEXT_LIMITS;

const requiredString = (field, label, { max = 500, min = 1 } = {}) =>
  body(field)
    .optional()
    .trim()
    .isLength({ min, max })
    .withMessage(`${label} must be between ${min} and ${max} characters`);

const openingHoursString = (field, requiredMessage) =>
  body(field)
    .optional()
    .trim()
    .custom((value) => {
      if (value === undefined || value === null) return true;
      const trimmed = String(value).trim();
      if (!trimmed) throw new Error(requiredMessage);
      if (trimmed.length < 5 || trimmed.length > 150) {
        throw new Error('Please enter valid opening hours.');
      }
      return true;
    });

const contactPhoneField = (field) =>
  body(field)
    .optional()
    .trim()
    .custom((value) => {
      if (value === undefined || value === null) return true;
      const error = validateContactPhone(value);
      if (error) throw new Error(error.message);
      return true;
    });

const contactEmailField = (field) =>
  body(field)
    .optional()
    .trim()
    .custom((value) => {
      if (value === undefined || value === null) return true;
      const error = validateContactEmail(value);
      if (error) throw new Error(error.message);
      return true;
    });

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

const optionalString = (field, label, { max = 500 } = {}) =>
  body(field)
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max })
    .withMessage(`${label} is too long`);

export const updateContactSettingsRules = [
  contactPhoneField('phoneNumber'),
  optionalString('phoneSubtext', 'Phone subtext', { max: phoneSubtextLimit.max }),
  contactEmailField('emailAddress'),
  optionalString('emailSubtext', 'Email subtext', { max: emailSubtextLimit.max }),
  requiredString('storeName', 'Store name', { max: storeNameLimit.max }),
  optionalString('storeAddress', 'Store address', { max: storeAddressLimit.max }),
  openingHoursString('supermarketOpeningHours', 'Supermarket opening hours are required.'),
  openingHoursString('foodCornerOpeningHours', 'Food Corner opening hours are required.'),
  requiredString('holidayNote', 'Holiday note', { max: 255 }),
  optionalString('heroBadge', 'Hero badge', { max: contactHeroBadge.max }),
  optionalString('heroTitle', 'Hero title', { max: contactHeroTitle.max }),
  optionalString('heroSubtitle', 'Hero subtitle', { max: contactHeroSubtitle.max }),
  optionalString('heroFeature1', 'Hero feature 1', { max: contactHeroFeature.max }),
  optionalString('heroFeature2', 'Hero feature 2', { max: contactHeroFeature.max }),
  optionalString('heroFeature3', 'Hero feature 3', { max: contactHeroFeature.max }),
  requiredString('formTitle', 'Form title', { max: 150 }),
  requiredString('formSubtitle', 'Form subtitle', { max: 500 }),
  requiredString('submitButtonText', 'Submit button text', { max: 100 }),
  requiredString('fullNameLabel', 'Full name label', { max: contactFormLabel.max }),
  requiredString('fullNamePlaceholder', 'Full name placeholder', { max: contactPlaceholder.max }),
  requiredString('emailLabel', 'Email label', { max: contactFormLabel.max }),
  requiredString('emailPlaceholder', 'Email placeholder', { max: contactPlaceholder.max }),
  requiredString('phoneLabel', 'Phone label', { max: contactFormLabel.max }),
  requiredString('phonePlaceholder', 'Phone placeholder', { max: contactPlaceholder.max }),
  requiredString('subjectLabel', 'Subject label', { max: contactFormLabel.max }),
  requiredString('subjectPlaceholder', 'Subject placeholder', { max: contactPlaceholder.max }),
  requiredString('messageLabel', 'Message label', { max: contactFormLabel.max }),
  requiredString('messagePlaceholder', 'Message placeholder', { max: contactPlaceholder.max }),
  requiredString('privacyNote', 'Privacy note', { max: contactPrivacyNote.max }),
  requiredString('infoCardTitle', 'Info card title', { max: 150 }),
  requiredString('infoCardSubtitle', 'Info card subtitle', { max: 500 }),
  requiredString('helpBoxTitle', 'Help box title', { max: 150 }),
  requiredString('helpBoxSubtitle', 'Help box subtitle', { max: 255 }),
  mapEmbedUrl('googleMapsEmbedUrl', 'Google Maps embed URL'),
];

export const updateSiteSettingsRules = [
  optionalString('storeName', 'Store name', { max: storeNameLimit.max }),
  optionalString('physicalAddress', 'Physical address', { max: storeAddressLimit.max }),
  optionalString('address', 'Address', { max: storeAddressLimit.max }),
  openingHoursString('supermarketOpeningHours', 'Supermarket opening hours are required.'),
  openingHoursString('foodCornerOpeningHours', 'Food Corner opening hours are required.'),
  openingHoursString('supermarketTimings', 'Supermarket opening hours are required.'),
  openingHoursString('foodCornerTimings', 'Food Corner opening hours are required.'),
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
  updateSiteSettingsRules,
  validateRequest,
};
