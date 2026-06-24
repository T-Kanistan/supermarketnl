import { body, param, query } from 'express-validator';
import { VACANCY_DEPARTMENTS, VACANCY_STATUSES } from '../models/Vacancy.js';
import { parseVacancyDate, assertClosingDateNotInPast } from '../utils/vacancyDate.js';

export const adminVacancyListQueryRules = [
  query('department').optional().isIn(['all', 'supermarket', 'food-corner']),
  query('status').optional().isIn(['all', ...VACANCY_STATUSES]),
  query('employmentType').optional().trim().isLength({ max: 50 }),
  query('search').optional().isString().trim().isLength({ max: 200 }),
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
];

export const vacancyIdRules = [param('id').isMongoId().withMessage('Invalid vacancy id')];

const titleRule = body().custom((_, { req }) => {
  const title = req.body.title || req.body.jobTitle;
  if (!title || !String(title).trim()) {
    throw new Error('Job title is required');
  }
  if (String(title).length > 200) {
    throw new Error('Job title must be at most 200 characters');
  }
  return true;
});

export const vacancyBodyRules = [
  titleRule,
  body('title').optional().trim().isLength({ max: 200 }),
  body('jobTitle').optional().trim().isLength({ max: 200 }),
  body('department').isIn(VACANCY_DEPARTMENTS),
  body('employmentType').trim().notEmpty().isLength({ max: 50 }),
  body('status').optional().isIn(VACANCY_STATUSES),
  body('location').optional().trim().isLength({ max: 200 }),
  body('workingDays').optional().trim().isLength({ max: 120 }),
  body('workingHours').optional().trim().isLength({ max: 120 }),
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
  body('description').optional().trim().isLength({ max: 5000 }),
  body('jobDescription').optional().trim().isLength({ max: 5000 }),
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
