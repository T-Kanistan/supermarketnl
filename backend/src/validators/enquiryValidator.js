import { body, param, query } from 'express-validator';

const sharedCustomerRules = [
  body('senderName')
    .optional()
    .trim()
    .isLength({ min: 3, max: 150 })
    .withMessage('Name must be at least 3 characters'),
  body('name')
    .optional()
    .trim()
    .isLength({ min: 3, max: 150 })
    .withMessage('Name must be at least 3 characters'),
  body('fullName')
    .optional()
    .trim()
    .isLength({ min: 3, max: 150 })
    .withMessage('Name must be at least 3 characters'),
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('phone')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 30 })
    .withMessage('Phone number is too long'),
  body('phoneNumber')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 30 })
    .withMessage('Phone number is too long'),
  body().custom((_, { req }) => {
    const phone = (req.body.phone || req.body.phoneNumber || '').trim();
    if (!phone) {
      throw new Error('Phone is required');
    }
    return true;
  }),
  body('message')
    .trim()
    .notEmpty()
    .withMessage('Message is required')
    .isLength({ max: 5000 })
    .withMessage('Message is too long'),
];

const ensureNameProvided = body().custom((_, { req }) => {
  const name = (req.body.senderName || req.body.fullName || req.body.name || '').trim();
  if (!name || name.length < 3) {
    throw new Error('Name must be at least 3 characters');
  }
  return true;
});

export const contactEnquiryRules = [
  ...sharedCustomerRules,
  ensureNameProvided,
  body('subject')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 200 })
    .withMessage('Subject is too long'),
  body('enquiryType')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 200 })
    .withMessage('Enquiry type is too long'),
  body().custom((_, { req }) => {
    const subject = (req.body.subject || req.body.enquiryType || '').trim();
    if (!subject) {
      throw new Error('Subject is required');
    }
    return true;
  }),
];

export const productEnquiryRules = [
  ...sharedCustomerRules,
  ensureNameProvided,
  body('productName')
    .trim()
    .notEmpty()
    .withMessage('Product name is required')
    .isLength({ max: 200 })
    .withMessage('Product name is too long'),
  body('quantityRequired')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 100 }),
  body('quantity')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 100 }),
];

export const foodCornerEnquiryRules = [
  ...sharedCustomerRules,
  ensureNameProvided,
  body('productName')
    .trim()
    .notEmpty()
    .withMessage('Product name is required')
    .isLength({ max: 200 })
    .withMessage('Product name is too long'),
];

export const legacySubmitMessageRules = contactEnquiryRules;
export const submitMessageRules = contactEnquiryRules;

export const enquiryReplyRules = [
  param('id').isMongoId().withMessage('Invalid enquiry id'),
  body('replyMessage')
    .trim()
    .notEmpty()
    .withMessage('Reply message is required')
    .isLength({ max: 5000 })
    .withMessage('Reply message is too long'),
];

export const enquiryIdRules = [param('id').isMongoId().withMessage('Invalid enquiry id')];

export const enquiryListQueryRules = [
  query('status').optional().isIn(['all', 'new', 'read', 'replied', 'closed']),
  query('enquiryType')
    .optional()
    .isIn(['all', 'contact-us', 'product-enquiry', 'food-corner-enquiry']),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('date').optional().isISO8601(),
];

export const markMessageReadRules = [
  body('isRead').optional().isBoolean().withMessage('isRead must be a boolean'),
];
