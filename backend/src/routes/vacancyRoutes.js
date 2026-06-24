import express from 'express';
import { getVacancies, getVacancyById } from '../controllers/vacancyController.js';
import { validateRequest } from '../middlewares/validationMiddleware.js';
import { vacancyIdRules } from '../validators/adminVacancyValidator.js';

const router = express.Router();

router.get('/', getVacancies);
router.get('/:id', vacancyIdRules, validateRequest, getVacancyById);

export default router;
