import User from '../models/User.js';
import Banner from '../models/Banner.js';
import FAQ from '../models/FAQ.js';
import Testimonial from '../models/Testimonial.js';
import Announcement from '../models/Announcement.js';

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
      },
    });
  } catch (error) {
    next(error);
  }
};
