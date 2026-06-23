import { body, param, query } from 'express-validator';

const dateRule = (field, { optional = false } = {}) => {
  const rule = body(field);
  if (optional) rule.optional({ checkFalsy: true });
  return rule
    .notEmpty()
    .withMessage(`${field} is required`)
    .isISO8601()
    .withMessage(`${field} must be a valid date`);
};

const mapLegacyFields = body().custom((_, { req }) => {
  if (!req.body.bannerImage && req.body.image) {
    req.body.bannerImage = req.body.image;
  }
  if (req.body.offerPercentage !== undefined && req.body.discountPercentage === undefined) {
    req.body.discountPercentage = req.body.offerPercentage;
  }
  return true;
});

export const createAnnouncementRules = [
  mapLegacyFields,
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ min: 3, max: 150 })
    .withMessage('Title must be between 3 and 150 characters'),
  body('description')
    .trim()
    .notEmpty()
    .withMessage('Description is required')
    .isLength({ min: 10, max: 2000 })
    .withMessage('Description must be between 10 and 2000 characters'),
  body('discountPercentage')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Discount percentage must be between 0 and 100'),
  body('offerPercentage')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Discount percentage must be between 0 and 100'),
  dateRule('startDate'),
  dateRule('endDate'),
  body('endDate').custom((endDate, { req }) => {
    const start = new Date(req.body.startDate);
    const end = new Date(endDate);
    if (end <= start) {
      throw new Error('End date must be greater than start date');
    }
    return true;
  }),
  body('status')
    .notEmpty()
    .withMessage('Status is required')
    .isIn(['active', 'inactive', 'draft', 'scheduled'])
    .withMessage('Status must be active, inactive, or draft'),
  body('bannerImage').optional().isString(),
  body('image').optional().isString(),
];

export const updateAnnouncementRules = [
  param('id').isMongoId().withMessage('Invalid announcement id'),
  mapLegacyFields,
  body('title')
    .optional()
    .trim()
    .isLength({ min: 3, max: 150 })
    .withMessage('Title must be between 3 and 150 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Description must be between 10 and 2000 characters'),
  body('discountPercentage')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Discount percentage must be between 0 and 100'),
  body('offerPercentage')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Discount percentage must be between 0 and 100'),
  body('startDate').optional({ checkFalsy: true }).isISO8601(),
  body('endDate')
    .optional({ checkFalsy: true })
    .isISO8601()
    .custom((endDate, { req }) => {
      if (req.body.startDate && endDate) {
        const start = new Date(req.body.startDate);
        const end = new Date(endDate);
        if (end <= start) {
          throw new Error('End date must be greater than start date');
        }
      }
      return true;
    }),
  body('status')
    .optional()
    .isIn(['active', 'inactive', 'draft', 'scheduled', 'expired'])
    .withMessage('Invalid status value'),
  body('bannerImage').optional().isString(),
  body('image').optional().isString(),
];

export const announcementIdRules = [param('id').isMongoId().withMessage('Invalid announcement id')];

export const announcementListQueryRules = [
  query('status').optional().isIn(['all', 'active', 'inactive', 'draft', 'scheduled', 'expired']),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('date').optional().isISO8601(),
  query('search').optional().trim().isLength({ min: 1, max: 200 }),
  query('q').optional().trim().isLength({ min: 1, max: 200 }),
];

export const searchAnnouncementRules = [
  query('q').optional().trim().isLength({ min: 1, max: 200 }),
  query('search').optional().trim().isLength({ min: 1, max: 200 }),
];
