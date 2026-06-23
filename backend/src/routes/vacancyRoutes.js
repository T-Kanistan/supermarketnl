import express from 'express';
import { getVacancies, getVacancyById } from '../controllers/vacancyController.js';

const router = express.Router();

router.get('/', getVacancies);
router.get('/:id', getVacancyById);

export default router;
