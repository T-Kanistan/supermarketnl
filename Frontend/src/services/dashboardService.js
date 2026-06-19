import api, { request } from './api';
import { localDb } from './localDb';

export const dashboardService = {
  getStats: async () => {
    return request(
      async () => {
        const response = await api.get('/dashboard/stats');
        const data = response.data;
        const stats = data.data || data;
        
        return {
          data: {
            totalProducts: stats.products?.total || 0,
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
          },
        };
      },
      () => {
        const products = localDb.getProducts();
        const categories = localDb.getCategories();
        const testimonials = localDb.getTestimonials();
        const faqs = localDb.getFaqs();
        const messages = localDb.getMessages();
        const banners = localDb.getBanners();

        const activeBanners = banners.filter(b => b.status === 'active').length;

        // Mock recent activity list based on database states
        const recentActivities = [
          { id: 'act1', type: 'message', text: `Received a new contact message from ${messages[0]?.name || 'John'}`, time: '1 hour ago' },
          { id: 'act2', type: 'product', text: `Product database contains ${products.length} entries`, time: 'Just now' },
          { id: 'act3', type: 'category', text: `Catalog active with ${categories.length} categories`, time: '2 hours ago' },
          { id: 'act4', type: 'testimonial', text: `Review board loaded with ${testimonials.length} client feedbacks`, time: 'Yesterday' }
        ];

        return {
          totalProducts: products.length,
          totalCategories: categories.length,
          totalTestimonials: testimonials.length,
          totalFaqs: faqs.length,
          totalMessages: messages.length,
          activeBanners,
          recentActivities
        };
      }
    );
  }
};

export default dashboardService;
