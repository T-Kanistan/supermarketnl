import api, { request } from './api';
import { localDb } from './localDb';

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
    return request(
      async () => {
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
      () => {
        const products = localDb.getProducts();
        const categories = localDb.getCategories();
        const testimonials = localDb.getTestimonials();
        const faqs = localDb.getFaqs();
        const messages = localDb.getMessages();
        const banners = localDb.getBanners();
        const activeBanners = banners.filter((b) => b.status === 'active').length;

        const groceryCount = products.filter(
          (p) => p.productType === 'grocery' || p.type === 'grocery' || p.type === 'Grocery'
        ).length;
        const foodCornerCount = products.filter(
          (p) =>
            p.productType === 'food-corner' ||
            p.type === 'food' ||
            p.type === 'food-corner' ||
            p.type === 'Food Corner'
        ).length;

        return {
          totalProducts: groceryCount,
          foodCornerProducts: foodCornerCount,
          activeOffers: 0,
          totalEnquiries: messages.length,
          unreadEnquiries: messages.filter((m) => !m.isRead).length,
          activeAnnouncements: 0,
          totalCategories: categories.length,
          totalTestimonials: testimonials.length,
          totalFaqs: faqs.length,
          totalMessages: messages.length,
          activeBanners,
          recentActivities: [
            { id: 'act1', type: 'message', text: `Received a new contact message from ${messages[0]?.name || 'John'}`, time: '1 hour ago' },
            { id: 'act2', type: 'product', text: `Product database contains ${products.length} entries`, time: 'Just now' },
          ],
        };
      }
    );
  },

  getRecentActivities: async () => {
    return request(
      async () => {
        if (!isManagerUser()) return [];
        const response = await api.get('/manager/recent-activities');
        return response.data?.data || [];
      },
      () => []
    );
  },

  getRecentEnquiries: async () => {
    return request(
      async () => {
        if (!isManagerUser()) return [];
        const response = await api.get('/manager/recent-enquiries');
        return response.data?.data || [];
      },
      () => []
    );
  },
};

export default dashboardService;
