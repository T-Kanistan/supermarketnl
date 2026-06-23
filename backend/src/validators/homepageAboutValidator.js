import { body, param } from 'express-validator';

const mapLegacyFields = body().custom((_, { req }) => {
  if (req.body.useAboutUsPageContent === undefined && req.body.useAboutUsContent !== undefined) {
    req.body.useAboutUsPageContent = req.body.useAboutUsContent;
  }
  return true;
});

export const createHomepageAboutRules = [
  mapLegacyFields,
  body('useAboutUsPageContent').optional().isBoolean(),
  body('sectionHeading').optional().trim().isLength({ max: 100 }),
  body('shortDescription').optional().trim().isLength({ max: 1000 }),
  body('buttonText').optional().trim().isLength({ max: 50 }),
  body('buttonLink').optional().trim(),
  body('status')
    .notEmpty()
    .withMessage('Status is required')
    .isIn(['active', 'inactive', 'draft', 'Active', 'Inactive']),
];

export const updateHomepageAboutRules = [
  param('id').isMongoId().withMessage('Invalid homepage about id'),
  mapLegacyFields,
  body('useAboutUsPageContent').optional().isBoolean(),
  body('sectionHeading').optional().trim().isLength({ max: 100 }),
  body('shortDescription').optional().trim().isLength({ max: 1000 }),
  body('buttonText').optional().trim().isLength({ max: 50 }),
  body('buttonLink').optional().trim(),
  body('status').optional().isIn(['active', 'inactive', 'draft', 'Active', 'Inactive']),
];

export const homepageAboutIdRules = [param('id').isMongoId().withMessage('Invalid homepage about id')];

export const updateHomepageAboutLegacyRules = [
  mapLegacyFields,
  body('useAboutUsPageContent').optional().isBoolean(),
  body('sectionHeading').optional().trim().isLength({ max: 100 }),
  body('shortDescription').optional().trim().isLength({ max: 1000 }),
  body('buttonText').optional().trim().isLength({ max: 50 }),
  body('buttonLink').optional().trim(),
  body('status').optional().isIn(['active', 'inactive', 'draft', 'Active', 'Inactive']),
];
