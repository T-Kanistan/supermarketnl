import Manager from '../models/Manager.js';
import HomepageBanner from '../models/HomepageBanner.js';
import FAQ from '../models/FAQ.js';
import Testimonial from '../models/Testimonial.js';
import Announcement from '../models/Announcement.js';
import Product from '../models/Product.js';
import Category from '../models/Category.js';
import CustomerEnquiry from '../models/CustomerEnquiry.js';

/**
 * @desc    Get dashboard metrics / counts
 * @route   GET /api/dashboard/stats
 * @access  Private (Admin / Manager)
 */
export const getStats = async (req, res, next) => {
  try {
    if (req.user.role === 'manager') {
      const [
        totalProducts,
        foodCornerProducts,
        activeOffers,
        totalEnquiries,
        unreadEnquiries,
        activeAnnouncements,
      ] = await Promise.all([
        // Grocery only (supermarket products)
        Product.countDocuments({
          status: 'active',
          $or: [{ productType: 'grocery' }, { type: 'grocery' }],
        }),
        // Food Corner only
        Product.countDocuments({
          status: 'active',
          $or: [
            { productType: 'food-corner' },
            { type: 'food' },
            { type: 'food-corner' },
          ],
        }),
        Announcement.countDocuments({ status: 'active' }),
        CustomerEnquiry.countDocuments({ status: { $ne: 'deleted' } }),
        CustomerEnquiry.countDocuments({ status: { $in: ['New', 'new'] }, isRead: false }),
        Announcement.countDocuments({ status: 'active' }),
      ]);

      return res.status(200).json({
        success: true,
        data: {
          totalProducts,
          foodCornerProducts,
          activeOffers,
          totalEnquiries,
          unreadEnquiries,
          activeAnnouncements,
          recentActivities: [
            {
              id: 'mgr-act1',
              type: 'product',
              text: `Catalog has ${totalProducts} grocery products`,
              time: 'Updated',
            },
            {
              id: 'mgr-act2',
              type: 'announcement',
              text: `${activeOffers} active offers running`,
              time: 'Updated',
            },
            {
              id: 'mgr-act3',
              type: 'message',
              text: `${unreadEnquiries} unread customer enquiries`,
              time: 'Updated',
            },
          ],
        },
      });
    }

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
      totalFoodCornerProducts,
      activeFoodCornerProducts,
      totalCategories,
      activeCategories,
      totalMessages,
      unreadMessages,
    ] = await Promise.all([
      Manager.countDocuments(),
      Manager.countDocuments({ status: true }),
      HomepageBanner.countDocuments({ status: { $ne: 'deleted' } }),
      HomepageBanner.countDocuments({ status: 'active' }),
      FAQ.countDocuments({ status: { $ne: 'deleted' } }),
      FAQ.countDocuments({ status: 'active' }),
      Testimonial.countDocuments({ status: { $ne: 'deleted' } }),
      Testimonial.countDocuments({ status: 'active' }),
      Announcement.countDocuments({ status: { $ne: 'deleted' } }),
      Announcement.countDocuments({ status: 'active', isExpired: { $ne: true } }),
      Product.countDocuments({
        $or: [{ productType: 'grocery' }, { type: 'grocery' }],
      }),
      Product.countDocuments({
        status: 'active',
        $or: [{ productType: 'grocery' }, { type: 'grocery' }],
      }),
      Product.countDocuments({
        $or: [
          { productType: 'food-corner' },
          { type: 'food' },
          { type: 'food-corner' },
        ],
      }),
      Product.countDocuments({
        status: 'active',
        $or: [
          { productType: 'food-corner' },
          { type: 'food' },
          { type: 'food-corner' },
        ],
      }),
      Category.countDocuments(),
      Category.countDocuments({ status: 'active' }),
      CustomerEnquiry.countDocuments({ status: { $ne: 'deleted' } }),
      CustomerEnquiry.countDocuments({ status: 'new', isRead: false }),
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
        foodCornerProducts: {
          total: totalFoodCornerProducts,
          active: activeFoodCornerProducts,
          inactive: totalFoodCornerProducts - activeFoodCornerProducts,
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
