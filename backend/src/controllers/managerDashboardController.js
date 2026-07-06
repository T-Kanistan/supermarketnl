import Announcement from '../models/Announcement.js';
import CustomerEnquiry from '../models/CustomerEnquiry.js';
import ActivityLog from '../models/ActivityLog.js';import { normalizeEnquiryStatus } from '../constants/enquiryStatuses.js';
import { fetchActiveCounts } from '../services/dashboardStatsService.js';

const ensureManager = (req, res) => {
  if (!req.user || req.user.role !== 'manager') {
    res.status(401).json({
      success: false,
      message: 'Unauthorized Access',
    });
    return false;
  }
  return true;
};

export const getManagerDashboard = async (req, res, next) => {
  try {
    if (!ensureManager(req, res)) return;

    const counts = await fetchActiveCounts();

    res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.status(200).json({
      success: true,
      data: {
        totalProducts: counts.activeGroceryProducts,
        foodCornerProducts: counts.activeFoodCornerProducts,
        activeOffers: counts.activeOffers,
        customerEnquiries: counts.activeMessages,
        unreadEnquiries: counts.unreadMessages,
        announcements: counts.activeOffers,
        lastUpdated: counts.fetchedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getManagerRecentActivities = async (req, res, next) => {
  try {
    if (!ensureManager(req, res)) return;

    const activities = await ActivityLog.find({ managerId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('module action description createdAt')
      .lean();

    res.status(200).json({
      success: true,
      data: activities,
    });
  } catch (error) {
    next(error);
  }
};

export const getManagerRecentEnquiries = async (req, res, next) => {
  try {
    if (!ensureManager(req, res)) return;

    const enquiries = await CustomerEnquiry.find({ status: { $ne: 'deleted' } })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('senderName subject status isRead createdAt enquiryType')
      .lean();

    res.status(200).json({
      success: true,
      data: enquiries.map((item) => ({
        customerName: item.senderName,
        subject: item.subject,
        status: normalizeEnquiryStatus(item.status),
        enquiryType: item.enquiryType,
        createdAt: item.createdAt,
      })),
    });
  } catch (error) {
    next(error);
  }
};

export const getOffers = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized Access' });
    }

    const offers = await Announcement.find().sort({ createdAt: -1 }).lean();
    res.status(200).json({
      success: true,
      count: offers.length,
      data: offers,
    });
  } catch (error) {
    next(error);
  }
};

export const getCustomerEnquiries = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized Access' });
    }

    const enquiries = await CustomerEnquiry.find({ status: { $ne: 'deleted' } })
      .sort({ createdAt: -1 })
      .lean();
    res.status(200).json({
      success: true,
      count: enquiries.length,
      data: enquiries.map((item) => ({
        id: item._id,
        customerName: item.senderName,
        email: item.email,
        phone: item.phone,
        subject: item.subject,
        message: item.message,
        enquiryType: item.enquiryType,
        status: item.status,
        isRead: item.isRead,
        createdAt: item.createdAt,
      })),
    });
  } catch (error) {
    next(error);
  }
};

export const getContentOverview = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized Access' });
    }

    const counts = await fetchActiveCounts();

    res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.status(200).json({
      success: true,
      data: {
        homepageBanner: counts.activeBanners,
        homepageAboutSection: 0,
        faqs: counts.activeFaqs,
        testimonials: counts.activeReviews,
        announcements: counts.activeOffers,
        lastUpdated: counts.fetchedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};
