import api from './api';

const isManagerUser = () => {
  try {
    const raw = localStorage.getItem('supermarket_user');
    if (!raw) return false;
    const user = JSON.parse(raw);
    return user?.role === 'manager';
  } catch {
    return false;
  }
};

const noCacheConfig = () => ({
  params: { _t: Date.now() },
  headers: { 'Cache-Control': 'no-cache', Pragma: 'no-cache' },
});

const mapActiveCounts = (counts = {}) => ({
  totalProducts: counts.activeGroceryProducts ?? 0,
  foodCornerProducts: counts.activeFoodCornerProducts ?? 0,
  totalCategories: counts.activeCategories ?? 0,
  totalTestimonials: counts.activeReviews ?? 0,
  totalFaqs: counts.activeFaqs ?? 0,
  totalMessages: counts.activeMessages ?? 0,
  activeBanners: counts.activeBanners ?? 0,
  inactiveBanners: counts.inactiveBanners ?? 0,
  totalBanners: counts.totalBanners ?? 0,
  activeOffers: counts.activeOffers ?? 0,
  unreadEnquiries: counts.unreadMessages ?? 0,
  totalEnquiries: counts.activeMessages ?? 0,
  activeAnnouncements: counts.activeOffers ?? 0,
});

export const dashboardService = {
  getActiveCounts: async () => {
    const response = await api.get('/dashboard/active-counts', noCacheConfig());
    return response.data?.data || {};
  },

  getStats: async () => {
    if (isManagerUser()) {
      const response = await api.get('/manager/dashboard', noCacheConfig());
      const stats = response.data?.data || {};
      return {
        totalProducts: stats.totalProducts || 0,
        foodCornerProducts: stats.foodCornerProducts || 0,
        activeOffers: stats.activeOffers || 0,
        totalEnquiries: stats.customerEnquiries || 0,
        unreadEnquiries: stats.unreadEnquiries || 0,
        activeAnnouncements: stats.announcements || 0,
        lastUpdated: stats.lastUpdated,
      };
    }

    const counts = await dashboardService.getActiveCounts();
    const mapped = mapActiveCounts(counts);

    return {
      ...mapped,
      recentActivities: [
        {
          id: 'act1',
          type: 'product',
          text: `Catalog has ${mapped.totalProducts} active grocery products`,
          time: 'Updated',
        },
        {
          id: 'act2',
          type: 'category',
          text: `${mapped.totalCategories} active categories configured`,
          time: 'Updated',
        },
        {
          id: 'act3',
          type: 'message',
          text: `${counts.unreadMessages || 0} unread contact messages`,
          time: 'Updated',
        },
      ],
    };
  },

  getRecentActivities: async () => {
    if (!isManagerUser()) return [];
    const response = await api.get('/manager/recent-activities', noCacheConfig());
    return response.data?.data || [];
  },

  getRecentEnquiries: async () => {
    if (!isManagerUser()) return [];
    const response = await api.get('/manager/recent-enquiries', noCacheConfig());
    return response.data?.data || [];
  },
};

export default dashboardService;
