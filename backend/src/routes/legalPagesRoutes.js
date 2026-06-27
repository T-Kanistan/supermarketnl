import express from 'express';
import {
  getLegalPages,
  updateLegalPages,
} from '../controllers/legalPagesController.js';
import { protect, adminOnly } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/', getLegalPages);

router.put('/', protect, adminOnly, updateLegalPages);

export default router;
