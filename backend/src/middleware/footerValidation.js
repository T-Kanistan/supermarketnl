import { body, param } from 'express-validator';
import { validationResult } from 'express-validator';
import {
  validateContactPhone,
  validateContactEmail,
} from '../utils/contactInfoValidation.js';
import {
  assertLegalLinksValid,
  validateLegalLinkLabel,
  validateLegalLinkPath,
  LEGAL_LINK_LABEL_MAX,
} from '../utils/legalLinksValidation.js';
import { ADMIN_TEXT_LIMITS } from '../utils/adminTextValidation.js';

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

const optionalText = (field, label, max = 5000) =>
  body(field).optional().trim().isLength({ max }).withMessage(`${label} is too long`);

const optionalOpeningHours = (field, requiredMessage) =>
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

const optionalContactPhone = (field) =>
  body(field)
    .optional()
    .trim()
    .custom((value) => {
      if (value === undefined || value === null) return true;
      const error = validateContactPhone(value);
      if (error) throw new Error(error.message);
      return true;
    });

const optionalContactEmail = (field) =>
  body(field)
    .optional()
    .trim()
    .custom((value) => {
      if (value === undefined || value === null) return true;
      const error = validateContactEmail(value);
      if (error) throw new Error(error.message);
      return true;
    });

const optionalUrl = (field, label) =>
  body(field).optional().trim().isLength({ max: 500 }).withMessage(`${label} is too long`);

export const updateFooterSettingsRules = [
  optionalText('footerDescription', 'Footer description', ADMIN_TEXT_LIMITS.footerDescription.max),
  optionalText('footer_logo', 'Footer logo path', 500),
  optionalText('quickLinksTitle', 'Quick links title', 150),
  optionalText('quick_links_title', 'Quick links title', 150),
  optionalText('categoriesTitle', 'Categories title', 150),
  optionalText('categories_title', 'Categories title', 150),
  optionalUrl('facebookUrl', 'Facebook URL'),
  optionalUrl('facebook_url', 'Facebook URL'),
  optionalUrl('instagramUrl', 'Instagram URL'),
  optionalUrl('instagram_url', 'Instagram URL'),
  optionalUrl('whatsappUrl', 'WhatsApp URL'),
  optionalUrl('whatsapp_url', 'WhatsApp URL'),
  optionalUrl('tiktokUrl', 'TikTok URL'),
  optionalUrl('tiktok_url', 'TikTok URL'),
  optionalUrl('youtubeUrl', 'YouTube URL'),
  optionalUrl('youtube_url', 'YouTube URL'),
  optionalText('businessHoursTitle', 'Business hours title', 150),
  optionalText('business_hours_title', 'Business hours title', 150),
  optionalText('supermarketLabel', 'Supermarket label', 100),
  optionalText('supermarket_label', 'Supermarket label', 100),
  optionalOpeningHours('supermarketHours', 'Supermarket opening hours are required.'),
  optionalOpeningHours('supermarket_hours', 'Supermarket opening hours are required.'),
  optionalText('foodCornerLabel', 'Food corner label', 100),
  optionalText('food_corner_label', 'Food corner label', 100),
  optionalOpeningHours('foodCornerHours', 'Food Corner opening hours are required.'),
  optionalOpeningHours('food_corner_hours', 'Food Corner opening hours are required.'),
  optionalText('specialHoursNote', 'Special hours note', 255),
  optionalText('special_hours_note', 'Special hours note', 255),
  optionalText('contactTitle', 'Contact title', 150),
  optionalText('contact_title', 'Contact title', 150),
  optionalText('address', 'Address', ADMIN_TEXT_LIMITS.storeAddress.max),
  optionalContactPhone('phoneNumber'),
  optionalContactPhone('phone_number'),
  optionalContactEmail('emailAddress'),
  optionalContactEmail('email_address'),
  optionalText('copyrightName', 'Copyright name', 150),
  optionalText('copyright_name', 'Copyright name', 150),
  body('legalLinks')
    .optional()
    .isArray()
    .withMessage('Legal links must be an array')
    .custom((links) => {
      assertLegalLinksValid(links);
      return true;
    }),
];

const linkIdRules = [
  param('id').isMongoId().withMessage('Valid link id is required'),
];

const createLinkRules = [
  body('label')
    .trim()
    .notEmpty()
    .withMessage('Label is required')
    .isLength({ max: LEGAL_LINK_LABEL_MAX })
    .withMessage('Label cannot exceed 50 characters.'),
  body('url').optional().trim().isLength({ max: 500 }).withMessage('URL is too long'),
  body('displayOrder').optional().isInt({ min: 0 }).withMessage('Display order must be a positive integer'),
  body('isVisible').optional().isBoolean().withMessage('isVisible must be a boolean'),
];

const createLegalLinkRules = [
  body('label')
    .trim()
    .custom((value) => {
      const error = validateLegalLinkLabel(value, { links: [] });
      if (error) throw new Error(error);
      return true;
    }),
  body('url')
    .trim()
    .custom((value) => {
      const error = validateLegalLinkPath(value, { links: [] });
      if (error) throw new Error(error);
      return true;
    }),
  body('displayOrder').optional().isInt({ min: 0 }).withMessage('Display order must be a positive integer'),
  body('isVisible').optional().isBoolean().withMessage('isVisible must be a boolean'),
];

const updateLegalLinkRules = [
  ...linkIdRules,
  body('label')
    .optional()
    .trim()
    .custom((value) => {
      if (value === undefined) return true;
      const error = validateLegalLinkLabel(value, { links: [] });
      if (error) throw new Error(error);
      return true;
    }),
  body('url')
    .optional()
    .trim()
    .custom((value) => {
      if (value === undefined) return true;
      const error = validateLegalLinkPath(value, { links: [] });
      if (error) throw new Error(error);
      return true;
    }),
  body('displayOrder').optional().isInt({ min: 0 }).withMessage('Display order must be a positive integer'),
  body('isVisible').optional().isBoolean().withMessage('isVisible must be a boolean'),
];

const updateLinkRules = [
  ...linkIdRules,
  body('label')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Label cannot be empty')
    .isLength({ max: LEGAL_LINK_LABEL_MAX })
    .withMessage('Label cannot exceed 50 characters.'),
  body('url').optional().trim().isLength({ max: 500 }).withMessage('URL is too long'),
  body('displayOrder').optional().isInt({ min: 0 }).withMessage('Display order must be a positive integer'),
  body('isVisible').optional().isBoolean().withMessage('isVisible must be a boolean'),
];

export const createQuickLinkRules = createLinkRules;
export const updateQuickLinkRules = updateLinkRules;
export const quickLinkIdRules = linkIdRules;

export { createLegalLinkRules, updateLegalLinkRules };
export const legalLinkIdRules = linkIdRules;

export default {
  validateRequest,
  updateFooterSettingsRules,
  createQuickLinkRules,
  updateQuickLinkRules,
  quickLinkIdRules,
  createLegalLinkRules,
  updateLegalLinkRules,
  legalLinkIdRules,
};
