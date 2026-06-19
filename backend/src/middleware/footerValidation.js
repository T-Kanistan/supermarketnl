import { body, param } from 'express-validator';
import { validationResult } from 'express-validator';

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

const optionalUrl = (field, label) =>
  body(field).optional().trim().isLength({ max: 500 }).withMessage(`${label} is too long`);

export const updateFooterSettingsRules = [
  optionalText('footerDescription', 'Footer description', 10000),
  optionalText('footer_logo', 'Footer logo path', 500),
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
  optionalText('supermarketHours', 'Supermarket hours', 100),
  optionalText('supermarket_hours', 'Supermarket hours', 100),
  optionalText('foodCornerLabel', 'Food corner label', 100),
  optionalText('food_corner_label', 'Food corner label', 100),
  optionalText('foodCornerHours', 'Food corner hours', 100),
  optionalText('food_corner_hours', 'Food corner hours', 100),
  optionalText('specialHoursNote', 'Special hours note', 255),
  optionalText('special_hours_note', 'Special hours note', 255),
  optionalText('contactTitle', 'Contact title', 150),
  optionalText('contact_title', 'Contact title', 150),
  optionalText('address', 'Address', 500),
  optionalText('phoneNumber', 'Phone number', 30),
  optionalText('phone_number', 'Phone number', 30),
  body('emailAddress').optional().trim().isEmail().withMessage('Valid email address is required'),
  body('email_address').optional().trim().isEmail().withMessage('Valid email address is required'),
  optionalText('copyrightName', 'Copyright name', 150),
  optionalText('copyright_name', 'Copyright name', 150),
];

const linkIdRules = [
  param('id').isMongoId().withMessage('Valid link id is required'),
];

const createLinkRules = [
  body('label').trim().notEmpty().withMessage('Label is required'),
  body('url').optional().trim().isLength({ max: 500 }).withMessage('URL is too long'),
  body('displayOrder').optional().isInt({ min: 0 }).withMessage('Display order must be a positive integer'),
  body('isVisible').optional().isBoolean().withMessage('isVisible must be a boolean'),
];

const updateLinkRules = [
  ...linkIdRules,
  body('label').optional().trim().notEmpty().withMessage('Label cannot be empty'),
  body('url').optional().trim().isLength({ max: 500 }).withMessage('URL is too long'),
  body('displayOrder').optional().isInt({ min: 0 }).withMessage('Display order must be a positive integer'),
  body('isVisible').optional().isBoolean().withMessage('isVisible must be a boolean'),
];

export const createQuickLinkRules = createLinkRules;
export const updateQuickLinkRules = updateLinkRules;
export const quickLinkIdRules = linkIdRules;

export const createCategoryLinkRules = createLinkRules;
export const updateCategoryLinkRules = updateLinkRules;
export const categoryLinkIdRules = linkIdRules;

export const createLegalLinkRules = createLinkRules;
export const updateLegalLinkRules = updateLinkRules;
export const legalLinkIdRules = linkIdRules;

export default {
  validateRequest,
  updateFooterSettingsRules,
  createQuickLinkRules,
  updateQuickLinkRules,
  quickLinkIdRules,
  createCategoryLinkRules,
  updateCategoryLinkRules,
  categoryLinkIdRules,
  createLegalLinkRules,
  updateLegalLinkRules,
  legalLinkIdRules,
};
