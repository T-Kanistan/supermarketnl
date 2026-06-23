import { body, param, query } from 'express-validator';
import { BANNER_PAGE_NAMES } from '../models/Banner.js';

export const bannerPageNameRules = [
  param('pageName')
    .trim()
    .isIn(BANNER_PAGE_NAMES)
    .withMessage(`Page name must be one of: ${BANNER_PAGE_NAMES.join(', ')}`),
];

export const bannerIdRules = [
  param('id').isMongoId().withMessage('Valid banner ID is required'),
];

export const listBannerRules = [
  query('pageName')
    .optional()
    .trim()
    .isIn(['all', ...BANNER_PAGE_NAMES])
    .withMessage('Invalid page filter'),
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('q').optional().trim().isLength({ max: 120 }),
];

const bannerFieldRules = [
  body('pageName')
    .optional()
    .trim()
    .isIn(BANNER_PAGE_NAMES)
    .withMessage(`Page name must be one of: ${BANNER_PAGE_NAMES.join(', ')}`),
  body('badgeText').optional().trim().isLength({ max: 120 }),
  body('mainHeading').optional().trim().isLength({ max: 200 }),
  body('highlightText').optional().trim().isLength({ max: 200 }),
  body('description').optional().trim().isLength({ max: 600 }),
  body('button1Text').optional().trim().isLength({ max: 80 }),
  body('button1Url').optional().trim(),
  body('button2Text').optional().trim().isLength({ max: 80 }),
  body('button2Url').optional().trim(),
  body('image').optional().trim(),
  body('overlayColor').optional().trim().isLength({ max: 30 }),
  body('overlayOpacity').optional().isFloat({ min: 0, max: 1 }).toFloat(),
  body('displayOrder').optional().isInt({ min: 0 }).toInt(),
  body('isActive').optional().isBoolean().toBoolean(),
];

export const createBannerRules = [
  body('pageName')
    .trim()
    .notEmpty()
    .withMessage('Page name is required')
    .isIn(BANNER_PAGE_NAMES),
  body('mainHeading').trim().notEmpty().withMessage('Main heading is required'),
  body('image').optional().trim(),
  ...bannerFieldRules,
];

export const updateBannerRules = [...bannerIdRules, ...bannerFieldRules];
