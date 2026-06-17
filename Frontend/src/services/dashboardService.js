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
            totalProducts: 0, // Fallback since Products module is not part of this phase
            totalCategories: 0, // Fallback since Categories module is not part of this phase
            totalTestimonials: stats.testimonials?.total || 0,
            totalFaqs: stats.faqs?.total || 0,
            totalMessages: 0, // Fallback since Contact messages module is not part of this phase
            activeBanners: stats.banners?.active || 0,
            recentActivities: [
              { id: 'act1', type: 'testimonial', text: `Review board has ${stats.testimonials?.total || 0} customer reviews`, time: 'Updated' },
              { id: 'act2', type: 'faq', text: `FAQ system initialized with ${stats.faqs?.total || 0} entries`, time: 'Updated' },
              { id: 'act3', type: 'banner', text: `Banners listing updated with ${stats.banners?.total || 0} slides`, time: 'Updated' }
            ]
          }
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
