import { body, param, query } from 'express-validator';
import { validationResult } from 'express-validator';
import { validateOwnerPhone, validateOwnerSinceYear, validateOwnerName } from '../utils/aboutOwnerValidation.js';
import { ADMIN_TEXT_LIMITS } from '../utils/adminTextValidation.js';

const {
  sectionTitle,
  sectionDescription,
  missionTitle,
  missionDescription,
  ownerName,
  ownerDesignation,
  ownerQuote,
  ownerExperience,
  ownerBadge,
} = ADMIN_TEXT_LIMITS;

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
  body('badge_text').trim().notEmpty().withMessage('Please fill in all required fields.').isLength({ max: sectionTitle.max }).withMessage(`Cannot exceed ${sectionTitle.max} characters.`),
  body('main_heading').trim().notEmpty().withMessage('Title is required.').isLength({ max: sectionTitle.max }).withMessage(`Cannot exceed ${sectionTitle.max} characters.`),
  body('highlight_heading').trim().notEmpty().withMessage('Please fill in all required fields.').isLength({ max: sectionTitle.max }).withMessage(`Cannot exceed ${sectionTitle.max} characters.`),
  body('description_1').trim().notEmpty().withMessage('Description is required.').isLength({ max: sectionDescription.max }).withMessage(`Cannot exceed ${sectionDescription.max} characters.`),
  body('description_2').optional().trim().isLength({ max: sectionDescription.max }),
  body('description_3').optional().trim().isLength({ max: sectionDescription.max }),
  body('description_4').optional().trim().isLength({ max: sectionDescription.max }),
  body('button1_text').optional().trim().isLength({ max: 100 }),
  body('button1_url').optional().trim().isLength({ max: 500 }),
  body('button2_text').optional().trim().isLength({ max: 100 }),
  body('button2_url').optional().trim().isLength({ max: 500 }),
  body('serving_badge_text').optional().trim().isLength({ max: sectionTitle.max }),
  body('image').trim().notEmpty().withMessage('Please fill in all required fields.'),
  body('display_order').optional().isInt({ min: 0 }),
  body('is_active').optional().isBoolean(),
];

export const storyRules = [
  body('title').trim().notEmpty().withMessage('Title is required.').isLength({ max: sectionTitle.max }).withMessage(`Cannot exceed ${sectionTitle.max} characters.`),
  body('description').trim().notEmpty().withMessage('Description is required.').isLength({ max: sectionDescription.max }).withMessage(`Cannot exceed ${sectionDescription.max} characters.`),
  body('image').trim().notEmpty().withMessage('Please fill in all required fields.'),
  body('is_active').optional().isBoolean(),
];

export const timelineCreateRules = [
  body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: sectionTitle.max }).withMessage(`Cannot exceed ${sectionTitle.max} characters.`),
  body('subtitle').trim().notEmpty().withMessage('Please fill in all required fields.').isLength({ max: sectionTitle.max }).withMessage(`Cannot exceed ${sectionTitle.max} characters.`),
  body('description').trim().notEmpty().withMessage('Description is required').isLength({ max: sectionDescription.max }).withMessage(`Cannot exceed ${sectionDescription.max} characters.`),
  body('icon').optional().trim().isLength({ max: 50 }),
  body('display_order').optional().isInt({ min: 0 }),
  body('is_active').optional().isBoolean(),
];

export const timelineUpdateRules = [
  param('id').isMongoId(),
  body('title').optional().trim().notEmpty().isLength({ max: sectionTitle.max }),
  body('subtitle').optional().trim().isLength({ max: sectionTitle.max }),
  body('description').optional().trim().isLength({ max: sectionDescription.max }),
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
  body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: missionTitle.max }).withMessage(`Cannot exceed ${missionTitle.max} characters.`),
  body('description').trim().notEmpty().withMessage('Description is required').isLength({ max: missionDescription.max }).withMessage(`Cannot exceed ${missionDescription.max} characters.`),
  body('icon').optional().trim().isLength({ max: 50 }),
  body('display_order').optional().isInt({ min: 0 }),
  body('is_active').optional().isBoolean(),
];

export const valueUpdateRules = [
  param('id').isMongoId(),
  body('title').optional().trim().notEmpty().isLength({ max: missionTitle.max }),
  body('description').optional().trim().isLength({ max: missionDescription.max }),
  body('icon').optional().trim().isLength({ max: 50 }),
  body('display_order').optional().isInt({ min: 0 }),
  body('is_active').optional().isBoolean(),
];

export const offerCreateRules = [
  body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: sectionTitle.max }).withMessage(`Cannot exceed ${sectionTitle.max} characters.`),
  body('description').trim().notEmpty().withMessage('Description is required').isLength({ max: sectionDescription.max }).withMessage(`Cannot exceed ${sectionDescription.max} characters.`),
  body('image').trim().notEmpty().withMessage('Image is required'),
  body('display_order').optional().isInt({ min: 0 }),
  body('is_active').optional().isBoolean(),
];

export const offerUpdateRules = [
  param('id').isMongoId(),
  body('title').optional().trim().notEmpty().isLength({ max: sectionTitle.max }),
  body('description').optional().trim().notEmpty().isLength({ max: sectionDescription.max }),
  body('image').optional().trim().notEmpty(),
  body('display_order').optional().isInt({ min: 0 }),
  body('is_active').optional().isBoolean(),
];

export const statisticCreateRules = [
  body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: sectionTitle.max }).withMessage(`Cannot exceed ${sectionTitle.max} characters.`),
  body('value').isNumeric().withMessage('Value is required'),
  body('suffix').optional().trim().isLength({ max: 10 }),
  body('icon').optional().trim().isLength({ max: 50 }),
  body('display_order').optional().isInt({ min: 0 }),
  body('is_active').optional().isBoolean(),
];

export const statisticUpdateRules = [
  param('id').isMongoId(),
  body('title').optional().trim().notEmpty().isLength({ max: sectionTitle.max }),
  body('value').optional().isNumeric(),
  body('suffix').optional().trim().isLength({ max: 10 }),
  body('icon').optional().trim().isLength({ max: 50 }),
  body('display_order').optional().isInt({ min: 0 }),
  body('is_active').optional().isBoolean(),
];

export const ownerRules = [
  body('owner_name')
    .trim()
    .notEmpty()
    .withMessage('Owner name is required.')
    .isLength({ max: ownerName.max })
    .withMessage(`Cannot exceed ${ownerName.max} characters.`)
    .custom((value) => {
      const result = validateOwnerName(value);
      if (!result.valid) throw new Error(result.error);
      return true;
    }),
  body('designation')
    .trim()
    .notEmpty()
    .withMessage('Designation is required.')
    .isLength({ max: ownerDesignation.max })
    .withMessage(`Cannot exceed ${ownerDesignation.max} characters.`),
  body('phone')
    .trim()
    .notEmpty()
    .withMessage('Phone number is required.')
    .custom((value) => {
      const result = validateOwnerPhone(value);
      if (!result.valid) throw new Error(result.error);
      return true;
    }),
  body('address').trim().notEmpty().withMessage('Address is required.'),
  body('quote')
    .trim()
    .notEmpty()
    .withMessage("Please enter the owner's quote.")
    .isLength({ max: ownerQuote.max })
    .withMessage(`Cannot exceed ${ownerQuote.max} characters.`),
  body('since_year')
    .trim()
    .notEmpty()
    .withMessage('Since Year is required.')
    .custom((value) => {
      const result = validateOwnerSinceYear(value);
      if (!result.valid) throw new Error(result.error);
      return true;
    }),
  body('experience_text')
    .trim()
    .notEmpty()
    .withMessage('Experience text is required.')
    .isLength({ max: ownerExperience.max })
    .withMessage(`Cannot exceed ${ownerExperience.max} characters.`),
  body('badge_text')
    .trim()
    .notEmpty()
    .withMessage('Badge text is required.')
    .isLength({ max: ownerBadge.max })
    .withMessage(`Cannot exceed ${ownerBadge.max} characters.`),
  body('profile_photo').trim().notEmpty().withMessage('Please upload a profile photo.'),
  body('is_active').optional().isBoolean(),
];

export const searchQueryRules = [
  query('search').optional().trim().isLength({ max: 200 }),
];
