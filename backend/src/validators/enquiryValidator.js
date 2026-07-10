import { body, param, query } from 'express-validator';
import {
  CONTACT_FORM_MESSAGE_REQUIRED,
  CONTACT_FORM_CONTACT_METHOD_REQUIRED,
  CONTACT_FORM_EMAIL_INVALID,
  CONTACT_FORM_PHONE_INVALID,
  resolveContactFormEmail,
  resolveContactFormPhone,
  validateContactFormEmail,
  validateContactFormPhone,
} from '../utils/contactFormValidation.js';

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
    .withMessage(CONTACT_FORM_EMAIL_INVALID)
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
  body('message')
    .trim()
    .notEmpty()
    .withMessage('Message is required')
    .isLength({ max: 5000 })
    .withMessage('Message is too long'),
];

const ensureNameProvided = body().custom((_, { req }) => {
  const name = (req.body.senderName || req.body.fullName || req.body.name || '').trim();
  if (name && name.length < 3) {
    throw new Error('Name must be at least 3 characters');
  }
  return true;
});

const optionalContactNameRules = [
  body('senderName')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ min: 3, max: 150 })
    .withMessage('Name must be at least 3 characters'),
  body('name')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ min: 3, max: 150 })
    .withMessage('Name must be at least 3 characters'),
  body('fullName')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ min: 3, max: 150 })
    .withMessage('Name must be at least 3 characters'),
];

const ensureContactMethodProvided = body().custom((_, { req }) => {
  const email = resolveContactFormEmail(req.body);
  const phone = resolveContactFormPhone(req.body);
  if (!email && !phone) {
    throw new Error(CONTACT_FORM_CONTACT_METHOD_REQUIRED);
  }
  return true;
});

const validateOptionalContactEmail = body('email')
  .optional({ values: 'falsy' })
  .trim()
  .custom((value) => {
    const error = validateContactFormEmail(value);
    if (error) throw new Error(error);
    return true;
  });

const validateOptionalContactPhone = [
  body('phone')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 30 })
    .withMessage('Phone number is too long')
    .custom((value) => {
      const error = validateContactFormPhone(value);
      if (error) throw new Error(error);
      return true;
    }),
  body('phoneNumber')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 30 })
    .withMessage('Phone number is too long')
    .custom((value) => {
      const error = validateContactFormPhone(value);
      if (error) throw new Error(error);
      return true;
    }),
];

export const contactEnquiryRules = [
  ...optionalContactNameRules,
  validateOptionalContactEmail,
  ...validateOptionalContactPhone,
  body('message')
    .trim()
    .notEmpty()
    .withMessage(CONTACT_FORM_MESSAGE_REQUIRED)
    .isLength({ max: 5000 })
    .withMessage('Message is too long'),
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
  body('source')
    .optional()
    .isIn(['website', 'whatsapp'])
    .withMessage('Invalid enquiry source'),
  ensureContactMethodProvided,
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
  query('status').optional().isIn(['all', 'New', 'Read', 'Replied', 'Closed', 'new', 'read', 'replied', 'closed']),
  query('enquiryType')
    .optional()
    .isIn(['all', 'contact-us', 'product-enquiry', 'food-corner-enquiry']),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('date').optional().isISO8601(),
  query('search').optional().trim().isLength({ max: 200 }).withMessage('Search query is too long'),
];

export const enquiryStatusRules = [
  param('id').isMongoId().withMessage('Invalid enquiry id'),
  body('status')
    .trim()
    .notEmpty()
    .withMessage('Status is required')
    .isIn(['New', 'Read', 'Replied', 'Closed', 'new', 'read', 'replied', 'closed'])
    .withMessage('Invalid enquiry status'),
];

export const markMessageReadRules = [
  body('isRead').optional().isBoolean().withMessage('isRead must be a boolean'),
];
