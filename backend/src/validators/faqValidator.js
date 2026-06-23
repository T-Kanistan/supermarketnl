import { body, param, query } from 'express-validator';

export const createFaqRules = [
  body('question')
    .trim()
    .notEmpty()
    .withMessage('Question is required')
    .isLength({ min: 5, max: 300 })
    .withMessage('Question must be between 5 and 300 characters'),
  body('answer')
    .trim()
    .notEmpty()
    .withMessage('Answer is required')
    .isLength({ min: 10, max: 5000 })
    .withMessage('Answer must be between 10 and 5000 characters'),
  body('status')
    .notEmpty()
    .withMessage('Status is required')
    .isIn(['active', 'inactive'])
    .withMessage('Status must be active or inactive'),
  body('displayOrder').optional().isInt({ min: 1 }).withMessage('Order must be a positive integer'),
  body('order').optional().isInt({ min: 1 }).withMessage('Order must be a positive integer'),
];

export const updateFaqRules = [
  param('id').isMongoId().withMessage('Invalid FAQ id'),
  body('question')
    .optional()
    .trim()
    .isLength({ min: 5, max: 300 })
    .withMessage('Question must be between 5 and 300 characters'),
  body('answer')
    .optional()
    .trim()
    .isLength({ min: 10, max: 5000 })
    .withMessage('Answer must be between 10 and 5000 characters'),
  body('status')
    .optional()
    .isIn(['active', 'inactive'])
    .withMessage('Status must be active or inactive'),
  body('displayOrder').optional().isInt({ min: 1 }).withMessage('Order must be a positive integer'),
  body('order').optional().isInt({ min: 1 }).withMessage('Order must be a positive integer'),
];

export const faqIdRules = [param('id').isMongoId().withMessage('Invalid FAQ id')];

export const saveFaqOrderRules = [
  body('faqIds').optional().isArray({ min: 1 }).withMessage('faqIds must be a non-empty array'),
  body('faqIds.*').optional().isMongoId().withMessage('Each faqId must be valid'),
  body('orders').optional().isArray({ min: 1 }).withMessage('orders must be a non-empty array'),
  body('orders.*.faqId').optional().isMongoId().withMessage('Each faqId must be valid'),
  body('orders.*.id').optional().isMongoId().withMessage('Each id must be valid'),
  body('orders.*.displayOrder')
    .optional()
    .isInt({ min: 1 })
    .withMessage('displayOrder must be a positive integer'),
  body('orders.*.order').optional().isInt({ min: 1 }).withMessage('order must be a positive integer'),
  body().custom((_, { req }) => {
    const hasFaqIds = Array.isArray(req.body.faqIds) && req.body.faqIds.length > 0;
    const hasOrders = Array.isArray(req.body.orders) && req.body.orders.length > 0;
    if (!hasFaqIds && !hasOrders) {
      throw new Error('faqIds or orders array is required');
    }
    return true;
  }),
];

export const searchFaqRules = [
  query('q').optional().trim().isLength({ min: 1, max: 200 }),
  query('search').optional().trim().isLength({ min: 1, max: 200 }),
];
