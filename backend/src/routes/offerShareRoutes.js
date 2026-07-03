import express from 'express';
import { param } from 'express-validator';
import { renderOfferSharePage } from '../controllers/offerShareController.js';
import { validateRequest } from '../middlewares/validationMiddleware.js';

const router = express.Router();

const publicOfferIdRules = [
  param('id').trim().notEmpty().withMessage('Offer id is required').isLength({ max: 100 }),
];

router.get('/:id', publicOfferIdRules, validateRequest, renderOfferSharePage);

export default router;
