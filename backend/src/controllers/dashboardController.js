import User from '../models/User.js';
import Banner from '../models/Banner.js';
import FAQ from '../models/FAQ.js';
import Testimonial from '../models/Testimonial.js';
import Announcement from '../models/Announcement.js';
import Product from '../models/Product.js';
import Category from '../models/Category.js';
import ContactMessage from '../models/ContactMessage.js';

/**
 * @desc    Get dashboard metrics / counts
 * @route   GET /api/dashboard/stats
 * @access  Private (Admin / Manager)
 */
export const getStats = async (req, res, next) => {
  try {
    const [
      totalManagers,
      activeManagers,
      totalBanners,
      activeBanners,
      totalFaqs,
      activeFaqs,
      totalTestimonials,
      activeTestimonials,
      totalAnnouncements,
      activeAnnouncements,
      totalProducts,
      activeProducts,
      totalCategories,
      activeCategories,
      totalMessages,
      unreadMessages,
    ] = await Promise.all([
      User.countDocuments({ role: 'manager' }),
      User.countDocuments({ role: 'manager', isActive: true }),
      Banner.countDocuments(),
      Banner.countDocuments({ status: 'active' }),
      FAQ.countDocuments(),
      FAQ.countDocuments({ status: 'active' }),
      Testimonial.countDocuments(),
      Testimonial.countDocuments({ status: 'active' }),
      Announcement.countDocuments(),
      Announcement.countDocuments({ status: 'active' }),
      Product.countDocuments(),
      Product.countDocuments({ status: 'active' }),
      Category.countDocuments(),
      Category.countDocuments({ status: 'active' }),
      ContactMessage.countDocuments(),
      ContactMessage.countDocuments({ isRead: false }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        managers: {
          total: totalManagers,
          active: activeManagers,
          inactive: totalManagers - activeManagers,
        },
        banners: {
          total: totalBanners,
          active: activeBanners,
          inactive: totalBanners - activeBanners,
        },
        faqs: {
          total: totalFaqs,
          active: activeFaqs,
          inactive: totalFaqs - activeFaqs,
        },
        testimonials: {
          total: totalTestimonials,
          active: activeTestimonials,
          inactive: totalTestimonials - activeTestimonials,
        },
        announcements: {
          total: totalAnnouncements,
          active: activeAnnouncements,
          inactive: totalAnnouncements - activeAnnouncements,
        },
        products: {
          total: totalProducts,
          active: activeProducts,
          inactive: totalProducts - activeProducts,
        },
        categories: {
          total: totalCategories,
          active: activeCategories,
          inactive: totalCategories - activeCategories,
        },
        messages: {
          total: totalMessages,
          unread: unreadMessages,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};
