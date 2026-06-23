import express from 'express';
import { protect, restrictTo } from '../middlewares/authMiddleware.js';
import {
  getOffers,
  getCustomerEnquiries,
  getContentOverview,
} from '../controllers/managerDashboardController.js';

const router = express.Router();

router.get('/offers', protect, restrictTo('admin', 'manager'), getOffers);
router.get('/customer-enquiries', protect, restrictTo('admin', 'manager'), getCustomerEnquiries);
router.get('/content/overview', protect, restrictTo('admin', 'manager'), getContentOverview);

export default router;
