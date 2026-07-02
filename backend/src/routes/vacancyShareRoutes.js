import express from 'express';
import { renderVacancySharePage } from '../controllers/vacancyShareController.js';
import { publicVacancyIdRules } from '../validators/adminVacancyValidator.js';
import { validateRequest } from '../middlewares/validationMiddleware.js';

const router = express.Router();

router.get('/:id', publicVacancyIdRules, validateRequest, renderVacancySharePage);

export default router;
