import Manager from '../models/Manager.js';
import Announcement from '../models/Announcement.js';
import CustomerEnquiry from '../models/CustomerEnquiry.js';
import Product from '../models/Product.js';
import { fetchActiveCounts } from '../services/dashboardStatsService.js';

/**
 * @desc    Active-record counts only (always fresh from DB)
 * @route   GET /api/dashboard/active-counts
 * @access  Private (Admin / Manager)
 */
export const getActiveCounts = async (req, res, next) => {
  try {
    const counts = await fetchActiveCounts();
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.status(200).json({
      success: true,
      data: counts,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get dashboard metrics / counts
 * @route   GET /api/dashboard/stats
 * @access  Private (Admin / Manager)
 */
export const getStats = async (req, res, next) => {
  try {
    const counts = await fetchActiveCounts();

    if (req.user.role === 'manager') {
      return res.status(200).json({
        success: true,
        data: {
          totalProducts: counts.activeGroceryProducts,
          foodCornerProducts: counts.activeFoodCornerProducts,
          activeOffers: counts.activeOffers,
          totalEnquiries: counts.activeMessages,
          unreadEnquiries: counts.unreadMessages,
          activeAnnouncements: counts.activeOffers,
          recentActivities: [
            {
              id: 'mgr-act1',
              type: 'product',
              text: `Catalog has ${counts.activeGroceryProducts} active grocery products`,
              time: 'Updated',
            },
            {
              id: 'mgr-act2',
              type: 'announcement',
              text: `${counts.activeOffers} active offers running`,
              time: 'Updated',
            },
            {
              id: 'mgr-act3',
              type: 'message',
              text: `${counts.unreadMessages} unread customer enquiries`,
              time: 'Updated',
            },
          ],
        },
      });
    }

    const [totalManagers, activeManagers] = await Promise.all([
      Manager.countDocuments(),
      Manager.countDocuments({ status: true }),
    ]);

    res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.status(200).json({
      success: true,
      data: {
        managers: {
          total: totalManagers,
          active: activeManagers,
          inactive: totalManagers - activeManagers,
        },
        products: {
          total: counts.activeGroceryProducts,
          active: counts.activeGroceryProducts,
          inactive: 0,
        },
        foodCornerProducts: {
          total: counts.activeFoodCornerProducts,
          active: counts.activeFoodCornerProducts,
          inactive: 0,
        },
        categories: {
          total: counts.activeCategories,
          active: counts.activeCategories,
          inactive: 0,
        },
        testimonials: {
          total: counts.activeReviews,
          active: counts.activeReviews,
          inactive: 0,
        },
        faqs: {
          total: counts.activeFaqs,
          active: counts.activeFaqs,
          inactive: 0,
        },
        messages: {
          total: counts.activeMessages,
          unread: counts.unreadMessages,
        },
        banners: {
          total: counts.totalBanners,
          active: counts.activeBanners,
          inactive: counts.inactiveBanners,
        },
        announcements: {
          total: counts.activeOffers,
          active: counts.activeOffers,
          inactive: 0,
        },
        activeCounts: counts,
      },
    });
  } catch (error) {
    next(error);
  }
};
