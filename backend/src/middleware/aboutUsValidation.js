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

export const updateAboutUsRules = [
  optionalText('homepageShortDescription', 'Homepage short description', 5000),
  body('homepageAboutSection').optional().isObject().withMessage('homepageAboutSection must be an object'),
  body('heroSection').optional().isObject().withMessage('heroSection must be an object'),
  body('storySection').optional().isObject().withMessage('storySection must be an object'),
  body('storyTimeline').optional().isArray().withMessage('storyTimeline must be an array'),
  body('missionVisionPromise').optional().isObject().withMessage('missionVisionPromise must be an object'),
  body('mvpCards').optional().isArray().withMessage('mvpCards must be an array'),
  body('ownerDetails').optional().isObject().withMessage('ownerDetails must be an object'),
  body('whatWeOffer').optional().isArray().withMessage('whatWeOffer must be an array'),
  body('statistics').optional().isArray().withMessage('statistics must be an array'),
];

export const createOfferRules = [
  body('categoryName').trim().notEmpty().withMessage('Category name is required'),
  body('description').optional().trim().isLength({ max: 500 }),
  body('imageUrl').optional().trim().isLength({ max: 2000 }),
  body('displayOrder').optional().isInt({ min: 0 }).withMessage('Display order must be a positive integer'),
  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),
];

export const updateOfferRules = [
  param('id').isMongoId().withMessage('Valid offer id is required'),
  body('categoryName').optional().trim().notEmpty().withMessage('Category name cannot be empty'),
  body('description').optional().trim().isLength({ max: 500 }),
  body('imageUrl').optional().trim().isLength({ max: 2000 }),
  body('displayOrder').optional().isInt({ min: 0 }),
  body('isActive').optional().isBoolean(),
];

export const offerIdRules = [
  param('id').isMongoId().withMessage('Valid offer id is required'),
];

export const reorderOffersRules = [
  body('orders').isArray({ min: 1 }).withMessage('orders must be a non-empty array'),
  body('orders.*.id').isMongoId().withMessage('Each order item requires a valid id'),
  body('orders.*.displayOrder').isInt({ min: 0 }).withMessage('Each order item requires displayOrder'),
];

export const createStatisticRules = [
  body('value').isNumeric().withMessage('Statistic value is required'),
  body('suffix').optional().trim().isLength({ max: 10 }),
  body('label').trim().notEmpty().withMessage('Statistic label is required'),
  body('icon').optional().trim().isLength({ max: 50 }),
  body('displayOrder').optional().isInt({ min: 0 }),
  body('isActive').optional().isBoolean(),
];

export const updateStatisticRules = [
  param('id').isMongoId().withMessage('Valid statistic id is required'),
  body('value').optional().isNumeric(),
  body('suffix').optional().trim().isLength({ max: 10 }),
  body('label').optional().trim().notEmpty().withMessage('Statistic label cannot be empty'),
  body('icon').optional().trim().isLength({ max: 50 }),
  body('displayOrder').optional().isInt({ min: 0 }),
  body('isActive').optional().isBoolean(),
];

export const statisticIdRules = [
  param('id').isMongoId().withMessage('Valid statistic id is required'),
];

export const reorderStatisticsRules = [
  body('orders').isArray({ min: 1 }).withMessage('orders must be a non-empty array'),
  body('orders.*.id').isMongoId().withMessage('Each order item requires a valid id'),
  body('orders.*.displayOrder').isInt({ min: 0 }).withMessage('Each order item requires displayOrder'),
];

export const createTimelineRules = [
  body('marker').trim().notEmpty().withMessage('Timeline marker is required'),
  body('title').trim().notEmpty().withMessage('Timeline title is required'),
  body('description').optional().trim().isLength({ max: 1000 }),
  body('icon').optional().trim().isLength({ max: 50 }),
  body('displayOrder').optional().isInt({ min: 0 }),
  body('isActive').optional().isBoolean(),
];

export const updateTimelineRules = [
  param('id').isMongoId().withMessage('Valid timeline id is required'),
  body('marker').optional().trim().notEmpty(),
  body('title').optional().trim().notEmpty(),
  body('description').optional().trim().isLength({ max: 1000 }),
  body('icon').optional().trim().isLength({ max: 50 }),
  body('displayOrder').optional().isInt({ min: 0 }),
  body('isActive').optional().isBoolean(),
];

export const timelineIdRules = [
  param('id').isMongoId().withMessage('Valid timeline id is required'),
];

export const reorderTimelineRules = [
  body('orders').isArray({ min: 1 }).withMessage('orders must be a non-empty array'),
  body('orders.*.id').isMongoId().withMessage('Each order item requires a valid id'),
  body('orders.*.displayOrder').isInt({ min: 0 }).withMessage('Each order item requires displayOrder'),
];

export const createMvpCardRules = [
  body('title').trim().notEmpty().withMessage('Card title is required'),
  body('icon').optional().trim().isLength({ max: 50 }),
  body('description').optional().trim().isLength({ max: 2000 }),
  body('displayOrder').optional().isInt({ min: 0 }),
  body('isActive').optional().isBoolean(),
];

export const updateMvpCardRules = [
  param('id').isMongoId().withMessage('Valid MVP card id is required'),
  body('title').optional().trim().notEmpty(),
  body('icon').optional().trim().isLength({ max: 50 }),
  body('description').optional().trim().isLength({ max: 2000 }),
  body('displayOrder').optional().isInt({ min: 0 }),
  body('isActive').optional().isBoolean(),
];

export const mvpCardIdRules = [
  param('id').isMongoId().withMessage('Valid MVP card id is required'),
];

export const reorderMvpCardsRules = [
  body('orders').isArray({ min: 1 }).withMessage('orders must be a non-empty array'),
  body('orders.*.id').isMongoId().withMessage('Each order item requires a valid id'),
  body('orders.*.displayOrder').isInt({ min: 0 }).withMessage('Each order item requires displayOrder'),
];

export default {
  validateRequest,
  updateAboutUsRules,
  createOfferRules,
  updateOfferRules,
  offerIdRules,
  reorderOffersRules,
  createStatisticRules,
  updateStatisticRules,
  statisticIdRules,
};
