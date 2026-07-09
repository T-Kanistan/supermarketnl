import Product from '../models/Product.js';
import Category from '../models/Category.js';
import Testimonial from '../models/Testimonial.js';
import FAQ from '../models/FAQ.js';
import CustomerEnquiry from '../models/CustomerEnquiry.js';
import Banner from '../models/Banner.js';
import Announcement from '../models/Announcement.js';

const ACTIVE_GROCERY_FILTER = {
  status: 'active',
  $or: [{ productType: 'grocery' }, { type: 'grocery' }],
};

const ACTIVE_FOOD_CORNER_FILTER = {
  status: 'active',
  $or: [
    { productType: 'food-corner' },
    { type: 'food' },
    { type: 'food-corner' },
  ],
};

const ACTIVE_BANNER_FILTER = {
  isActive: true,
  deletedAt: null,
};

const ALL_BANNERS_FILTER = {
  deletedAt: null,
};

const INACTIVE_BANNER_FILTER = {
  isActive: false,
  deletedAt: null,
};

const AVAILABLE_MESSAGE_FILTER = {
  status: { $ne: 'deleted' },
};

/**
 * Fresh active-record counts from the database (no caching).
 */
export const fetchActiveCounts = async () => {
  const [
    activeGroceryProducts,
    activeFoodCornerProducts,
    activeCategories,
    activeReviews,
    activeFaqs,
    activeMessages,
    activeBanners,
    inactiveBanners,
    totalBanners,
    activeOffers,
    unreadMessages,
  ] = await Promise.all([
    Product.countDocuments(ACTIVE_GROCERY_FILTER),
    Product.countDocuments(ACTIVE_FOOD_CORNER_FILTER),
    Category.countDocuments({ status: 'active' }),
    Testimonial.countDocuments({ status: 'active' }),
    FAQ.countDocuments({ status: 'active' }),
    CustomerEnquiry.countDocuments(AVAILABLE_MESSAGE_FILTER),
    Banner.countDocuments(ACTIVE_BANNER_FILTER),
    Banner.countDocuments(INACTIVE_BANNER_FILTER),
    Banner.countDocuments(ALL_BANNERS_FILTER),
    Announcement.countDocuments({ status: 'active', isExpired: { $ne: true } }),
    CustomerEnquiry.countDocuments({ status: { $in: ['New', 'new'] }, isRead: false }),
  ]);

  return {
    activeGroceryProducts,
    activeFoodCornerProducts,
    activeCategories,
    activeReviews,
    activeFaqs,
    activeMessages,
    activeBanners,
    inactiveBanners,
    totalBanners,
    activeOffers,
    unreadMessages,
    fetchedAt: new Date().toISOString(),
  };
};

export default fetchActiveCounts;
