import Product from '../models/Product.js';
import Announcement from '../models/Announcement.js';
import CustomerEnquiry from '../models/CustomerEnquiry.js';
import { normalizeEnquiryStatus } from '../constants/enquiryStatuses.js';
import ActivityLog from '../models/ActivityLog.js';
import HomepageBanner from '../models/HomepageBanner.js';
import HomepageAboutSection from '../models/HomepageAboutSection.js';
import FAQ from '../models/FAQ.js';
import Testimonial from '../models/Testimonial.js';

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

    const [totalProducts, activeOffers, customerEnquiries, unreadEnquiries, announcements] =
      await Promise.all([
        // Grocery only (supermarket products)
        Product.countDocuments({
          status: 'active',
          $or: [{ productType: 'grocery' }, { type: 'grocery' }],
        }),
        Announcement.countDocuments({ status: 'active' }),
        CustomerEnquiry.countDocuments({ status: { $ne: 'deleted' } }),
        CustomerEnquiry.countDocuments({ status: { $in: ['New', 'new'] }, isRead: false }),
        Announcement.countDocuments({ status: 'active' }),
      ]);

    res.status(200).json({
      success: true,
      data: {
        totalProducts,
        foodCornerProducts: await Product.countDocuments({
          status: 'active',
          $or: [
            { productType: 'food-corner' },
            { type: 'food' },
            { type: 'food-corner' },
          ],
        }),
        activeOffers,
        customerEnquiries,
        unreadEnquiries,
        announcements,
        lastUpdated: new Date().toISOString(),
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

    const [
      activeBanners,
      homepageAboutActive,
      activeFaqs,
      activeTestimonials,
      activeAnnouncements,
    ] = await Promise.all([
      HomepageBanner.countDocuments({ status: 'active' }),
      HomepageAboutSection.countDocuments({ status: 'active' }),
      FAQ.countDocuments({ status: 'active' }),
      Testimonial.countDocuments({ status: 'active' }),
      Announcement.countDocuments({ status: 'active' }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        homepageBanner: activeBanners,
        homepageAboutSection: homepageAboutActive,
        faqs: activeFaqs,
        testimonials: activeTestimonials,
        announcements: activeAnnouncements,
        lastUpdated: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
};
