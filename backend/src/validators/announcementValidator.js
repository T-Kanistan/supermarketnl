import { body } from 'express-validator';

export const createAnnouncementRules = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Announcement title is required'),
  body('description')
    .trim()
    .notEmpty()
    .withMessage('Announcement description is required'),
  body('offerPercentage')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Offer percentage must be between 0 and 100')
    .toFloat(),
  body('startDate')
    .optional({ checkFalsy: true })
    .isISO8601()
    .withMessage('Start date must be a valid date format (ISO8601)')
    .toDate(),
  body('endDate')
    .optional({ checkFalsy: true })
    .isISO8601()
    .withMessage('End date must be a valid date format (ISO8601)')
    .toDate()
    .custom((endDate, { req }) => {
      if (req.body.startDate && endDate) {
        const start = new Date(req.body.startDate);
        const end = new Date(endDate);
        if (end <= start) {
          throw new Error('End date must be after start date');
        }
      }
      return true;
    }),
  body('status')
    .optional()
    .isIn(['active', 'inactive'])
    .withMessage('Status must be either active or inactive'),
];

export const updateAnnouncementRules = [
  body('title')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Title cannot be empty'),
  body('description')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Description cannot be empty'),
  body('offerPercentage')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Offer percentage must be between 0 and 100')
    .toFloat(),
  body('startDate')
    .optional({ checkFalsy: true })
    .isISO8601()
    .withMessage('Start date must be a valid date format (ISO8601)')
    .toDate(),
  body('endDate')
    .optional({ checkFalsy: true })
    .isISO8601()
    .withMessage('End date must be a valid date format (ISO8601)')
    .toDate()
    .custom((endDate, { req }) => {
      const startVal = req.body.startDate;
      if (startVal && endDate) {
        const start = new Date(startVal);
        const end = new Date(endDate);
        if (end <= start) {
          throw new Error('End date must be after start date');
        }
      }
      return true;
    }),
  body('status')
    .optional()
    .isIn(['active', 'inactive'])
    .withMessage('Status must be either active or inactive'),
];
