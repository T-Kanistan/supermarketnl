import { body, param } from 'express-validator';

const headingRule = (field, label) =>
  body(field)
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage(`${label} must not exceed 100 characters`);

const mapLegacyFields = body().custom((_, { req }) => {
  if (!req.body.headingLine1 && req.body.title) req.body.headingLine1 = req.body.title;
  if (!req.body.headingLine2 && req.body.highlightText) req.body.headingLine2 = req.body.highlightText;
  if (!req.body.headingLine3 && req.body.titleLine2) req.body.headingLine3 = req.body.titleLine2;
  if (!req.body.primaryButtonLabel && req.body.buttonText) {
    req.body.primaryButtonLabel = req.body.buttonText;
  }
  if (!req.body.primaryButtonLink && req.body.buttonLink) {
    req.body.primaryButtonLink = req.body.buttonLink;
  }
  if (!req.body.backgroundImage && req.body.image) req.body.backgroundImage = req.body.image;
  return true;
});

export const createHomeBannerRules = [
  mapLegacyFields,
  body('headingLine1')
    .trim()
    .notEmpty()
    .withMessage('Heading line 1 is required')
    .isLength({ max: 100 }),
  body('headingLine2')
    .trim()
    .notEmpty()
    .withMessage('Heading line 2 is required')
    .isLength({ max: 100 }),
  body('headingLine3')
    .trim()
    .notEmpty()
    .withMessage('Heading line 3 is required')
    .isLength({ max: 100 }),
  body('subtitle')
    .trim()
    .notEmpty()
    .withMessage('Subtitle is required')
    .isLength({ max: 300 }),
  body('primaryButtonLabel')
    .trim()
    .notEmpty()
    .withMessage('Primary button label is required')
    .isLength({ max: 50 }),
  body('primaryButtonLink').trim().notEmpty().withMessage('Primary button link is required'),
  body('secondaryButtonLabel').optional().trim().isLength({ max: 50 }),
  body('secondaryButtonLink').optional().trim(),
  body('status')
    .notEmpty()
    .withMessage('Status is required')
    .isIn(['active', 'inactive', 'draft'])
    .withMessage('Status must be active, inactive, or draft'),
  body('showOpenTimeCard').optional().isBoolean(),
  body('showOpenTime').optional().isBoolean(),
  body().custom((_, { req }) => {
    if (!req.file && !req.body.backgroundImage && !req.body.image) {
      throw new Error('Background image is required');
    }
    return true;
  }),
];

export const updateHomeBannerRules = [
  param('id').isMongoId().withMessage('Invalid banner id'),
  mapLegacyFields,
  headingRule('headingLine1', 'Heading line 1'),
  headingRule('headingLine2', 'Heading line 2'),
  headingRule('headingLine3', 'Heading line 3'),
  body('subtitle').optional().trim().isLength({ max: 300 }),
  body('primaryButtonLabel').optional().trim().isLength({ max: 50 }),
  body('primaryButtonLink').optional().trim(),
  body('secondaryButtonLabel').optional().trim().isLength({ max: 50 }),
  body('secondaryButtonLink').optional().trim(),
  body('status').optional().isIn(['active', 'inactive', 'draft']),
  body('showOpenTimeCard').optional().isBoolean(),
  body('showOpenTime').optional().isBoolean(),
];

export const homeBannerIdRules = [param('id').isMongoId().withMessage('Invalid banner id')];

// Legacy banner validator exports
export const createBannerRules = createHomeBannerRules;
export const updateBannerRules = updateHomeBannerRules;
