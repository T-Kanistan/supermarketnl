import { body, param, query } from 'express-validator';
import { VACANCY_DEPARTMENTS, VACANCY_STATUSES } from '../models/Vacancy.js';
import { parseVacancyDate, assertClosingDateNotInPast } from '../utils/vacancyDate.js';
import { ADMIN_TEXT_LIMITS, sanitizeAdminText } from '../utils/adminTextValidation.js';

const {
  vacancyTitle,
  vacancyLocation,
  vacancyEmploymentType,
  vacancyWorkingDays,
  vacancyWorkingHours,
  vacancyDescription,
} = ADMIN_TEXT_LIMITS;

export const adminVacancyListQueryRules = [
  query('department').optional().isIn(['all', 'supermarket', 'food-corner']),
  query('status').optional().isIn(['all', ...VACANCY_STATUSES]),
  query('employmentType').optional().trim().isLength({ max: vacancyEmploymentType.max }),
  query('search').optional().isString().trim().isLength({ max: 200 }),
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
];

export const vacancyIdRules = [param('id').isMongoId().withMessage('Invalid vacancy id')];

export const publicVacancyIdRules = [
  param('id').trim().notEmpty().withMessage('Vacancy id is required').isLength({ max: 100 }),
];

const titleRule = body().custom((_, { req }) => {
  const title = sanitizeAdminText(req.body.title || req.body.jobTitle);
  if (!title) {
    throw new Error('Job title is required');
  }
  if (title.length > vacancyTitle.max) {
    throw new Error(`Job title must be at most ${vacancyTitle.max} characters`);
  }
  return true;
});

const descriptionRule = body().custom((_, { req }) => {
  const description = sanitizeAdminText(req.body.description || req.body.jobDescription, {
    collapse: false,
  });
  if (!description) {
    throw new Error('Job description is required');
  }
  if (description.length > vacancyDescription.max) {
    throw new Error(`Job description must be at most ${vacancyDescription.max} characters`);
  }
  return true;
});

export const vacancyBodyRules = [
  titleRule,
  descriptionRule,
  body('title').optional().trim().isLength({ max: vacancyTitle.max }),
  body('jobTitle').optional().trim().isLength({ max: vacancyTitle.max }),
  body('department').isIn(VACANCY_DEPARTMENTS),
  body('employmentType')
    .trim()
    .notEmpty()
    .withMessage('Employment type is required')
    .isLength({ max: vacancyEmploymentType.max })
    .withMessage(`Employment type must be at most ${vacancyEmploymentType.max} characters`),
  body('status').optional().isIn(VACANCY_STATUSES),
  body('location')
    .trim()
    .notEmpty()
    .withMessage('Location is required')
    .isLength({ max: vacancyLocation.max })
    .withMessage(`Location must be at most ${vacancyLocation.max} characters`),
  body('workingDays')
    .optional()
    .trim()
    .isLength({ max: vacancyWorkingDays.max })
    .withMessage(`Working days must be at most ${vacancyWorkingDays.max} characters`),
  body('workingHours')
    .optional()
    .trim()
    .isLength({ max: vacancyWorkingHours.max })
    .withMessage(`Working hours must be at most ${vacancyWorkingHours.max} characters`),
  body('cvRequired')
    .optional()
    .custom((value) => {
      if (value === undefined || value === null || value === '') return true;
      if (typeof value === 'boolean') return true;
      if (value === 'true' || value === 'false') return true;
      throw new Error('cvRequired must be a boolean value');
    }),
  body('openDate').optional({ nullable: true }),
  body('closingDate')
    .optional({ nullable: true })
    .custom((value) => {
      if (value === undefined || value === null || value === '') return true;
      const parsed = parseVacancyDate(value);
      assertClosingDateNotInPast(parsed);
      return true;
    }),
  body('closeDate')
    .optional({ nullable: true })
    .custom((value, { req }) => {
      const raw = value ?? req.body.closingDate;
      if (raw === undefined || raw === null || raw === '') return true;
      const parsed = parseVacancyDate(raw);
      assertClosingDateNotInPast(parsed);
      return true;
    }),
  body('summary').optional().trim().isLength({ max: 1000 }),
  body('description')
    .optional()
    .trim()
    .isLength({ max: vacancyDescription.max })
    .withMessage(`Job description must be at most ${vacancyDescription.max} characters`),
  body('jobDescription')
    .optional()
    .trim()
    .isLength({ max: vacancyDescription.max })
    .withMessage(`Job description must be at most ${vacancyDescription.max} characters`),
  body('icon').optional().trim().isLength({ max: 50 }),
];

export const vacancyStatusRules = [
  ...vacancyIdRules,
  body('status').isIn(VACANCY_STATUSES),
];

export const vacancyExtendRules = [
  ...vacancyIdRules,
  body('closingDate')
    .notEmpty()
    .withMessage('Closing date is required')
    .custom((value) => {
      const parsed = parseVacancyDate(value);
      assertClosingDateNotInPast(parsed);
      return true;
    }),
];
