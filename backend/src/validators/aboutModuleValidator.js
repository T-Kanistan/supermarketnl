import { body, param, query } from 'express-validator';
import { validationResult } from 'express-validator';

export const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};

export const introductionRules = [
  body('badge_text').optional().trim().isLength({ max: 200 }),
  body('main_heading').optional().trim().isLength({ max: 500 }),
  body('highlight_heading').optional().trim().isLength({ max: 200 }),
  body('description_1').optional().trim().isLength({ max: 3000 }),
  body('description_2').optional().trim().isLength({ max: 3000 }),
  body('description_3').optional().trim().isLength({ max: 3000 }),
  body('description_4').optional().trim().isLength({ max: 3000 }),
  body('button1_text').optional().trim().isLength({ max: 100 }),
  body('button1_url').optional().trim().isLength({ max: 500 }),
  body('button2_text').optional().trim().isLength({ max: 100 }),
  body('button2_url').optional().trim().isLength({ max: 500 }),
  body('serving_badge_text').optional().trim().isLength({ max: 200 }),
  body('image').optional().trim().isLength({ max: 2000 }),
  body('display_order').optional().isInt({ min: 0 }),
  body('is_active').optional().isBoolean(),
];

export const storyRules = [
  body('title').optional().trim().notEmpty(),
  body('description').optional().trim().isLength({ max: 5000 }),
  body('image').optional().trim().isLength({ max: 2000 }),
  body('is_active').optional().isBoolean(),
];

export const timelineCreateRules = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('subtitle').optional().trim().isLength({ max: 200 }),
  body('description').optional().trim().isLength({ max: 2000 }),
  body('icon').optional().trim().isLength({ max: 50 }),
  body('display_order').optional().isInt({ min: 0 }),
  body('is_active').optional().isBoolean(),
];

export const timelineUpdateRules = [
  param('id').isMongoId(),
  body('title').optional().trim().notEmpty(),
  body('subtitle').optional().trim().isLength({ max: 200 }),
  body('description').optional().trim().isLength({ max: 2000 }),
  body('icon').optional().trim().isLength({ max: 50 }),
  body('display_order').optional().isInt({ min: 0 }),
  body('is_active').optional().isBoolean(),
];

export const reorderRules = [
  body('orders').isArray({ min: 1 }),
  body('orders.*.id').isMongoId(),
  body('orders.*.display_order').isInt({ min: 0 }),
];

export const mongoIdRules = [param('id').isMongoId()];

export const valueCreateRules = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('description').optional().trim().isLength({ max: 3000 }),
  body('icon').optional().trim().isLength({ max: 50 }),
  body('display_order').optional().isInt({ min: 0 }),
  body('is_active').optional().isBoolean(),
];

export const valueUpdateRules = [
  param('id').isMongoId(),
  body('title').optional().trim().notEmpty(),
  body('description').optional().trim().isLength({ max: 3000 }),
  body('icon').optional().trim().isLength({ max: 50 }),
  body('display_order').optional().isInt({ min: 0 }),
  body('is_active').optional().isBoolean(),
];

export const offerCreateRules = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('image').trim().notEmpty().withMessage('Image is required'),
  body('display_order').optional().isInt({ min: 0 }),
  body('is_active').optional().isBoolean(),
];

export const offerUpdateRules = [
  param('id').isMongoId(),
  body('title').optional().trim().notEmpty(),
  body('description').optional().trim().notEmpty(),
  body('image').optional().trim().notEmpty(),
  body('display_order').optional().isInt({ min: 0 }),
  body('is_active').optional().isBoolean(),
];

export const statisticCreateRules = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('value').isNumeric().withMessage('Value is required'),
  body('suffix').optional().trim().isLength({ max: 10 }),
  body('icon').optional().trim().isLength({ max: 50 }),
  body('display_order').optional().isInt({ min: 0 }),
  body('is_active').optional().isBoolean(),
];

export const statisticUpdateRules = [
  param('id').isMongoId(),
  body('title').optional().trim().notEmpty(),
  body('value').optional().isNumeric(),
  body('suffix').optional().trim().isLength({ max: 10 }),
  body('icon').optional().trim().isLength({ max: 50 }),
  body('display_order').optional().isInt({ min: 0 }),
  body('is_active').optional().isBoolean(),
];

export const ownerRules = [
  body('owner_name').trim().notEmpty().withMessage('Owner name is required'),
  body('designation').trim().notEmpty().withMessage('Designation is required'),
  body('phone').trim().notEmpty().withMessage('Phone is required'),
  body('address').trim().notEmpty().withMessage('Address is required'),
  body('quote').optional().trim().isLength({ max: 3000 }),
  body('since_year').optional().trim().isLength({ max: 20 }),
  body('experience_text').optional().trim().isLength({ max: 200 }),
  body('badge_text').optional().trim().isLength({ max: 200 }),
  body('profile_photo').optional().trim().isLength({ max: 2000 }),
  body('is_active').optional().isBoolean(),
];

export const searchQueryRules = [
  query('search').optional().trim().isLength({ max: 200 }),
];
