import api, { apiRequest } from './api';

export const faqService = {
  getFaqs: async () => apiRequest(() => api.get('/faqs')),

  getAllFaqs: async () => apiRequest(() => api.get('/faqs/all')),

  createFaq: async (faqData) => apiRequest(() => api.post('/faqs', faqData)),

  updateFaq: async (id, faqData) => apiRequest(() => api.put(`/faqs/${id}`, faqData)),

  deleteFaq: async (id) => apiRequest(() => api.delete(`/faqs/${id}`)),

  reorderFaqs: async (orders) => apiRequest(() => api.put('/faqs/reorder', orders)),
};

export default faqService;
