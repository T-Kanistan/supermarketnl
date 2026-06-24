import { body, param, query } from 'express-validator';
import { BANNER_PAGE_TYPES, normalizePageType } from '../models/Banner.js';

const PAGE_TYPE_VALUES = [...BANNER_PAGE_TYPES, 'food-corner', 'all'];

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
];

const bannerFieldRules = [
  body('pageType').optional().trim(),
  body('pageName').optional().trim(),
  body('badgeText').optional().trim().isLength({ max: 120 }),
  body('title').optional().trim().isLength({ max: 200 }),
  body('highlightedTitle').optional().trim().isLength({ max: 200 }),
  body('mainHeading').optional().trim().isLength({ max: 200 }),
  body('highlightText').optional().trim().isLength({ max: 200 }),
  body('description').optional().trim().isLength({ max: 600 }),
  body('buttonText').optional().trim().isLength({ max: 80 }),
  body('buttonUrl').optional().trim(),
  body('button1Text').optional().trim().isLength({ max: 80 }),
  body('button1Url').optional().trim(),
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
      if (!(value || req.body.mainHeading)?.trim()) {
        throw new Error('Title is required');
      }
      return true;
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
