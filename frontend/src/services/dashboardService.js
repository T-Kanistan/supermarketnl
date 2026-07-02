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

export const dashboardService = {
  getStats: async () => {
    if (isManagerUser()) {
      const response = await api.get('/manager/dashboard');
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

    const response = await api.get('/dashboard/stats');
    const stats = response.data?.data || response.data;

    return {
      totalProducts: stats.products?.total || 0,
      foodCornerProducts: stats.foodCornerProducts?.total || 0,
      totalCategories: stats.categories?.total || 0,
      totalTestimonials: stats.testimonials?.total || 0,
      totalFaqs: stats.faqs?.total || 0,
      totalMessages: stats.messages?.total || 0,
      activeBanners: stats.banners?.active || 0,
      recentActivities: [
        { id: 'act1', type: 'product', text: `Catalog has ${stats.products?.total || 0} products`, time: 'Updated' },
        { id: 'act2', type: 'category', text: `${stats.categories?.total || 0} categories configured`, time: 'Updated' },
        { id: 'act3', type: 'message', text: `${stats.messages?.unread || 0} unread contact messages`, time: 'Updated' },
      ],
    };
  },

  getRecentActivities: async () => {
    if (!isManagerUser()) return [];
    const response = await api.get('/manager/recent-activities');
    return response.data?.data || [];
  },

  getRecentEnquiries: async () => {
    if (!isManagerUser()) return [];
    const response = await api.get('/manager/recent-enquiries');
    return response.data?.data || [];
  },
};

export default dashboardService;
