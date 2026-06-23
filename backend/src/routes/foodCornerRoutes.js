import express from 'express';
import { getFoodCornerItems } from '../controllers/foodCornerController.js';
import foodCornerCategoryRoutes from './foodCornerCategoryRoutes.js';

const router = express.Router();

router.get('/items', getFoodCornerItems);
router.use('/', foodCornerCategoryRoutes);

export default router;
