import { body, param, query } from 'express-validator';
import { BANNER_PAGE_TYPES, normalizePageType } from '../models/Banner.js';
import { ADMIN_TEXT_LIMITS, expressTextValidator } from '../utils/adminTextValidation.js';

const { bannerBadge, bannerTitle, bannerHighlightedTitle, bannerDescription } = ADMIN_TEXT_LIMITS;

const optionalBannerTextRule = (field, max, label) =>
  body(field)
    .optional()
    .trim()
    .custom(
      expressTextValidator({
        max,
        maxMessage: `${label} cannot exceed ${max} characters.`,
      })
    );

const validateTitleText = (value, { req }) => {
  const text = value || req.body.mainHeading;
  if (!text?.trim()) return true;
  return expressTextValidator({
    max: bannerTitle.max,
    maxMessage: `Title cannot exceed ${bannerTitle.max} characters.`,
  })(text);
};

const bannerFieldRules = [
  body('pageType').optional().trim(),
  body('pageName').optional().trim(),
  optionalBannerTextRule('badgeText', bannerBadge.max, 'Badge text'),
  body('title').optional().trim().custom(validateTitleText),
  body('mainHeading').optional().trim().custom(validateTitleText),
  optionalBannerTextRule('highlightedTitle', bannerHighlightedTitle.max, 'Highlighted title'),
  optionalBannerTextRule('highlightText', bannerHighlightedTitle.max, 'Highlighted title'),
  optionalBannerTextRule('description', bannerDescription.max, 'Description'),
  body('backgroundImage').optional().trim(),
  body('image').optional().trim(),
  body('sideCardTitle').optional().trim().isLength({ max: 120 }),
  body('sideCardDescription').optional().trim().isLength({ max: 300 }),
  body('sideCardIcon').optional().trim().isLength({ max: 80 }),
  body('overlayColor').optional().trim().isLength({ max: 30 }),
  body('overlayOpacity').optional().isFloat({ min: 0, max: 1 }).toFloat(),
  body('displayOrder').optional().isInt({ min: 0 }).toInt(),
  body('isActive').optional().isBoolean().toBoolean(),
];

export const bannerPageTypeRules = [
  param('pageType')
    .trim()
    .custom((value) => {
      const normalized = normalizePageType(value);
      if (!BANNER_PAGE_TYPES.includes(normalized)) {
        throw new Error(`Page type must be one of: ${BANNER_PAGE_TYPES.join(', ')}`);
      }
      return true;
    }),
];

export const bannerIdRules = [
  param('id').isMongoId().withMessage('Valid banner ID is required'),
];

export const listBannerRules = [
  query('pageType')
    .optional()
    .trim()
    .custom((value) => {
      if (value === 'all') return true;
      const normalized = normalizePageType(value);
      if (!BANNER_PAGE_TYPES.includes(normalized)) {
        throw new Error('Invalid page type filter');
      }
      return true;
    }),
  query('pageName').optional().trim(),
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('q').optional().trim().isLength({ max: 120 }),
  query('status')
    .optional()
    .trim()
    .custom((value) => {
      if (!value || value === 'all') return true;
      if (!['active', 'inactive'].includes(String(value).toLowerCase())) {
        throw new Error('Status filter must be all, active, or inactive');
      }
      return true;
    }),
];

export const createBannerRules = [
  body('pageType')
    .optional()
    .trim()
    .custom((value, { req }) => {
      const pageType = normalizePageType(value || req.body.pageName);
      if (!BANNER_PAGE_TYPES.includes(pageType)) {
        throw new Error(`Page type must be one of: ${BANNER_PAGE_TYPES.join(', ')}`);
      }
      return true;
    }),
  body('pageName')
    .optional()
    .trim()
    .custom((value, { req }) => {
      if (!req.body.pageType && !value) {
        throw new Error('Page type is required');
      }
      return true;
    }),
  body('title')
    .optional()
    .trim()
    .custom((value, { req }) => {
      const text = value || req.body.mainHeading;
      if (!text?.trim()) {
        throw new Error('Title is required');
      }
      return expressTextValidator({
        required: true,
        max: bannerTitle.max,
        requiredMessage: 'Title is required',
        maxMessage: `Title cannot exceed ${bannerTitle.max} characters.`,
      })(text);
    }),
  body('isActive')
    .optional()
    .custom((value) => {
      if (value === undefined || value === null || value === '') return true;
      if (value === true || value === false || value === 'true' || value === 'false') return true;
      throw new Error('Status must be active or inactive');
    }),
  ...bannerFieldRules,
];

export const updateBannerRules = [...bannerIdRules, ...bannerFieldRules];

export const updateBannerStatusRules = [
  ...bannerIdRules,
  body('isActive').isBoolean().withMessage('isActive must be a boolean').toBoolean(),
];

// Legacy export
export const bannerPageNameRules = bannerPageTypeRules;
