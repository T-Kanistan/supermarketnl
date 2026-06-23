import express from 'express';
import { protect, restrictTo } from '../middlewares/authMiddleware.js';
import {
  getManagerDashboard,
  getManagerRecentActivities,
  getManagerRecentEnquiries,
  getOffers,
  getCustomerEnquiries,
  getContentOverview,
} from '../controllers/managerDashboardController.js';

const router = express.Router();

const requireManager = (req, res, next) => {
  if (!req.user || req.user.role !== 'manager') {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized Access',
    });
  }
  return next();
};

router.get('/dashboard', protect, requireManager, getManagerDashboard);
router.get('/recent-activities', protect, requireManager, getManagerRecentActivities);
router.get('/recent-enquiries', protect, requireManager, getManagerRecentEnquiries);

router.get('/offers', protect, restrictTo('admin', 'manager'), getOffers);
router.get('/customer-enquiries', protect, restrictTo('admin', 'manager'), getCustomerEnquiries);
router.get('/content/overview', protect, restrictTo('admin', 'manager'), getContentOverview);

export default router;
