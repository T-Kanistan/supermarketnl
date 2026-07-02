import express from 'express';
import { getVacancies, getVacancyById } from '../controllers/vacancyController.js';
import { getVacancyShareMeta } from '../controllers/vacancyShareController.js';
import { validateRequest } from '../middlewares/validationMiddleware.js';
import { publicVacancyIdRules } from '../validators/adminVacancyValidator.js';

const router = express.Router();

router.get('/', getVacancies);
router.get('/:id/share-meta', publicVacancyIdRules, validateRequest, getVacancyShareMeta);
router.get('/:id', publicVacancyIdRules, validateRequest, getVacancyById);

export default router;
