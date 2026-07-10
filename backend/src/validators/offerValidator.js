import { body, param } from 'express-validator';
import { OFFER_DISCOUNT_TYPES, OFFER_DEPARTMENT_TYPES } from '../models/Offer.js';
import { ADMIN_TEXT_LIMITS, expressTextValidator } from '../utils/adminTextValidation.js';

const { offerTitle, offerDescription, offerBadge } = ADMIN_TEXT_LIMITS;

const isValidImageUrl = (value) => {
  if (value === undefined || value === null || value === '') return true;
  const url = String(value).trim();
  if (!url) return true;
  return (
    url.startsWith('/uploads/') ||
    url.startsWith('http://') ||
    url.startsWith('https://') ||
    url.startsWith('data:image/')
  );
};

const imageRule = (required = false) =>
  body(['image', 'imageUrl']).custom((_, { req }) => {
    const value = req.body.image ?? req.body.imageUrl;
    if (!value || String(value).trim() === '') {
      if (required) throw new Error('Offer image is required');
      return true;
    }
    if (!isValidImageUrl(value)) {
      throw new Error('Image URL must use /uploads/, http://, https://, or data:image/');
    }
    return true;
  });

const optionalDateRule = (field) =>
  body(field)
    .optional({ values: 'falsy' })
    .custom((value) => {
      if (value === undefined || value === null || value === '') return true;
      if (Number.isNaN(new Date(value).getTime())) {
        throw new Error(`${field} must be a valid date`);
      }
      return true;
    });

const optionalNumberRule = (field, label) =>
  body(field)
    .optional({ nullable: true })
    .custom((value) => {
      if (value === undefined || value === null || value === '') return true;
      const num = Number(value);
      if (Number.isNaN(num) || num < 0) {
        throw new Error(`${label} must be a number greater than or equal to 0`);
      }
      return true;
    });

const booleanRule = (field, label) =>
  body(field)
    .optional({ values: 'null' })
    .custom((value) => {
      if (value === undefined || value === null || value === '') return true;
      if (typeof value === 'boolean') return true;
      if (['true', 'false', '0', '1', 0, 1].includes(value)) return true;
      throw new Error(`${label} must be a boolean value`);
    });

export const createOfferRules = [
  body('title')
    .trim()
    .custom(
      expressTextValidator({
        required: true,
        max: offerTitle.max,
        requiredMessage: 'Offer title is required',
        maxMessage: `Offer title cannot exceed ${offerTitle.max} characters.`,
      })
    ),
  body('category').trim().notEmpty().withMessage('Offer category is required'),
  body('offerDepartment')
    .optional({ values: 'falsy' })
    .isIn(OFFER_DEPARTMENT_TYPES)
    .withMessage(`Offer department must be one of: ${OFFER_DEPARTMENT_TYPES.join(', ')}`),
  body('offerType')
    .optional({ values: 'falsy' })
    .isIn(OFFER_DEPARTMENT_TYPES)
    .withMessage(`Offer department must be one of: ${OFFER_DEPARTMENT_TYPES.join(', ')}`),
  body('subtitle').optional({ values: 'null' }).isLength({ max: 200 }),
  body('description')
    .optional({ values: 'null' })
    .custom(
      expressTextValidator({
        max: offerDescription.max,
        maxMessage: `Description cannot exceed ${offerDescription.max} characters.`,
      })
    ),
  body('discountType')
    .optional({ values: 'falsy' })
    .isIn(OFFER_DISCOUNT_TYPES)
    .withMessage(`Discount type must be one of: ${OFFER_DISCOUNT_TYPES.join(', ')}`),
  optionalNumberRule('discountValue', 'Discount value'),
  optionalNumberRule('originalPrice', 'Original price'),
  optionalNumberRule('offerPrice', 'Offer price'),
  body('offerBadge')
    .optional({ values: 'null' })
    .custom(
      expressTextValidator({
        max: offerBadge.max,
        maxMessage: `Offer badge cannot exceed ${offerBadge.max} characters.`,
      })
    ),
  imageRule(true),
  optionalDateRule('startDate'),
  optionalDateRule('endDate'),
  body('buttonText').optional({ values: 'null' }).isLength({ max: 50 }),
  body('buttonLink').optional({ values: 'null' }),
  booleanRule('featured', 'Featured'),
  body('status').optional().isIn(['active', 'inactive']),
  optionalNumberRule('sortOrder', 'Sort order'),
];

export const updateOfferRules = [
  param('id').isMongoId().withMessage('Invalid offer id'),
  body('title')
    .optional({ values: 'falsy' })
    .trim()
    .custom(
      expressTextValidator({
        required: true,
        max: offerTitle.max,
        requiredMessage: 'Offer title cannot be empty',
        maxMessage: `Offer title cannot exceed ${offerTitle.max} characters.`,
      })
    ),
  body('category').optional({ values: 'falsy' }).trim().notEmpty().withMessage('Offer category cannot be empty'),
  body('offerDepartment')
    .optional({ values: 'falsy' })
    .isIn(OFFER_DEPARTMENT_TYPES)
    .withMessage(`Offer department must be one of: ${OFFER_DEPARTMENT_TYPES.join(', ')}`),
  body('offerType')
    .optional({ values: 'falsy' })
    .isIn(OFFER_DEPARTMENT_TYPES)
    .withMessage(`Offer department must be one of: ${OFFER_DEPARTMENT_TYPES.join(', ')}`),
  body('subtitle').optional({ values: 'null' }).isLength({ max: 200 }),
  body('description')
    .optional({ values: 'null' })
    .custom(
      expressTextValidator({
        max: offerDescription.max,
        maxMessage: `Description cannot exceed ${offerDescription.max} characters.`,
      })
    ),
  body('discountType')
    .optional({ values: 'falsy' })
    .isIn(OFFER_DISCOUNT_TYPES)
    .withMessage(`Discount type must be one of: ${OFFER_DISCOUNT_TYPES.join(', ')}`),
  optionalNumberRule('discountValue', 'Discount value'),
  optionalNumberRule('originalPrice', 'Original price'),
  optionalNumberRule('offerPrice', 'Offer price'),
  body('offerBadge')
    .optional({ values: 'null' })
    .custom(
      expressTextValidator({
        max: offerBadge.max,
        maxMessage: `Offer badge cannot exceed ${offerBadge.max} characters.`,
      })
    ),
  imageRule(false),
  optionalDateRule('startDate'),
  optionalDateRule('endDate'),
  body('buttonText').optional({ values: 'null' }).isLength({ max: 50 }),
  body('buttonLink').optional({ values: 'null' }),
  booleanRule('featured', 'Featured'),
  body('status').optional().isIn(['active', 'inactive']),
  optionalNumberRule('sortOrder', 'Sort order'),
];

export const offerIdRules = [param('id').isMongoId().withMessage('Invalid offer id')];

export const updateOfferStatusRules = [
  param('id').isMongoId().withMessage('Invalid offer id'),
  body('status')
    .notEmpty()
    .withMessage('Status is required')
    .isIn(['active', 'inactive'])
    .withMessage('Status must be active or inactive'),
];

export const updateOfferBannerRules = [
  body('heroTitle').optional({ values: 'null' }).isLength({ max: 150 }),
  body('heroSubtitle').optional({ values: 'null' }).isLength({ max: 200 }),
  body('heroDescription').optional({ values: 'null' }).isLength({ max: 600 }),
  body('heroButtonText').optional({ values: 'null' }).isLength({ max: 50 }),
  body('heroButtonLink').optional({ values: 'null' }).trim(),
  body('heroButton2Text').optional({ values: 'null' }).isLength({ max: 50 }),
  body('heroButton2Link').optional({ values: 'null' }).trim(),
  body('heroOverlayColor').optional({ values: 'null' }).trim(),
  body('heroOverlayOpacity').optional().isFloat({ min: 0, max: 1 }),
  body('promoTitle').optional({ values: 'null' }).isLength({ max: 150 }),
  body('promoSubtitle').optional({ values: 'null' }).isLength({ max: 200 }),
  body('promoDescription').optional({ values: 'null' }).isLength({ max: 600 }),
  body('promoButtonText').optional({ values: 'null' }).isLength({ max: 50 }),
  body('promoOverlayColor').optional({ values: 'null' }).trim(),
  body('promoOverlayOpacity').optional().isFloat({ min: 0, max: 1 }),
  body(['heroImage', 'promoImage']).custom((_, { req }) => {
    for (const key of ['heroImage', 'promoImage']) {
      const value = req.body[key];
      if (value && !isValidImageUrl(value)) {
        throw new Error(`${key} must use /uploads/, http://, https://, or data:image/`);
      }
    }
    return true;
  }),
];

export const offersHeroBannerIdRules = [
  param('id').isMongoId().withMessage('Invalid hero banner id'),
];

export const createOffersHeroBannerRules = [
  body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 150 }),
  body('highlightedTitle').optional({ values: 'null' }).isLength({ max: 100 }),
  body('badgeText').optional({ values: 'null' }).isLength({ max: 60 }),
  body('description').optional({ values: 'null' }).isLength({ max: 600 }),
  body('buttonText').optional({ values: 'null' }).isLength({ max: 50 }),
  body('buttonUrl').optional({ values: 'null' }).trim(),
  body('button2Text').optional({ values: 'null' }).isLength({ max: 50 }),
  body('button2Url').optional({ values: 'null' }).trim(),
  body('overlayColor').optional({ values: 'null' }).trim(),
  body('overlayOpacity').optional().isFloat({ min: 0, max: 1 }),
  body('offerType').optional().isIn(['Supermarket', 'Food Corner']),
  body('offerCategory').optional({ values: 'null' }).isLength({ max: 100 }),
  body('discountType').optional().isIn(['percentage', 'flat', 'bogo', 'combo']),
  body('discountValue').optional().isFloat({ min: 0 }),
  body('offerBadge').optional({ values: 'null' }).isLength({ max: 60 }),
  body('status').optional().isIn(['active', 'inactive', 'draft']),
  body('startDate').notEmpty().withMessage('Start date is required'),
  body('endDate').notEmpty().withMessage('End date is required'),
  optionalNumberRule('sortOrder', 'Sort order'),
  body(['bannerImage', 'backgroundImage', 'heroImage']).custom((_, { req }) => {
    for (const key of ['bannerImage', 'backgroundImage', 'heroImage']) {
      const value = req.body[key];
      if (value && !isValidImageUrl(value)) {
        throw new Error(`${key} must use /uploads/, http://, https://, or data:image/`);
      }
    }
    return true;
  }),
];

export const updateOffersHeroBannerRules = [
  ...offersHeroBannerIdRules,
  body('title').optional().trim().notEmpty().withMessage('Title cannot be empty').isLength({ max: 150 }),
  body('highlightedTitle').optional({ values: 'null' }).isLength({ max: 100 }),
  body('badgeText').optional({ values: 'null' }).isLength({ max: 60 }),
  body('description').optional({ values: 'null' }).isLength({ max: 600 }),
  body('buttonText').optional({ values: 'null' }).isLength({ max: 50 }),
  body('buttonUrl').optional({ values: 'null' }).trim(),
  body('button2Text').optional({ values: 'null' }).isLength({ max: 50 }),
  body('button2Url').optional({ values: 'null' }).trim(),
  body('overlayColor').optional({ values: 'null' }).trim(),
  body('overlayOpacity').optional().isFloat({ min: 0, max: 1 }),
  body('offerType').optional().isIn(['Supermarket', 'Food Corner']),
  body('offerCategory').optional({ values: 'null' }).isLength({ max: 100 }),
  body('discountType').optional().isIn(['percentage', 'flat', 'bogo', 'combo']),
  body('discountValue').optional().isFloat({ min: 0 }),
  body('offerBadge').optional({ values: 'null' }).isLength({ max: 60 }),
  body('status').optional().isIn(['active', 'inactive', 'draft']),
  body('startDate').optional().notEmpty(),
  body('endDate').optional().notEmpty(),
  optionalNumberRule('sortOrder', 'Sort order'),
  body(['bannerImage', 'backgroundImage', 'heroImage']).custom((_, { req }) => {
    for (const key of ['bannerImage', 'backgroundImage', 'heroImage']) {
      const value = req.body[key];
      if (value && !isValidImageUrl(value)) {
        throw new Error(`${key} must use /uploads/, http://, https://, or data:image/`);
      }
    }
    return true;
  }),
];

export const updateOffersHeroBannerStatusRules = [
  ...offersHeroBannerIdRules,
  body('status')
    .notEmpty()
    .withMessage('Status is required')
    .isIn(['active', 'inactive', 'draft'])
    .withMessage('Status must be active, inactive, or draft'),
];
