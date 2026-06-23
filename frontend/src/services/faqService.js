import api, { apiRequest } from './api';

export const faqService = {
  getStorefrontFaqs: async () => apiRequest(() => api.get('/storefront/faqs')),

  getFaqs: async () => faqService.getStorefrontFaqs(),

  getAllFaqs: async () => apiRequest(() => api.get('/faqs')),

  searchFaqs: async (query) =>
    apiRequest(() => api.get('/faqs/search', { params: { q: query } })),

  getFaqById: async (id) => apiRequest(() => api.get(`/faqs/${id}`)),

  createFaq: async (faqData) => apiRequest(() => api.post('/faqs', faqData)),

  updateFaq: async (id, faqData) => apiRequest(() => api.put(`/faqs/${id}`, faqData)),

  deleteFaq: async (id) => apiRequest(() => api.delete(`/faqs/${id}`)),

  moveFaqUp: async (id) => apiRequest(() => api.post(`/faqs/${id}/move-up`)),

  moveFaqDown: async (id) => apiRequest(() => api.post(`/faqs/${id}/move-down`)),

  saveFaqOrder: async (payload) => {
    if (Array.isArray(payload) && payload.length && payload[0]?.displayOrder !== undefined) {
      return apiRequest(() =>
        api.post('/faqs/save-order', {
          orders: payload.map((item) => ({
            faqId: item.faqId || item.id,
            displayOrder: item.displayOrder,
          })),
        })
      );
    }
    return apiRequest(() => api.post('/faqs/save-order', { faqIds: payload }));
  },

  reorderFaqs: async (orders) => {
    const faqIds = [...orders]
      .sort((a, b) => (a.order || 0) - (b.order || 0))
      .map((item) => item.id);
    return faqService.saveFaqOrder(faqIds);
  },
};

export default faqService;
