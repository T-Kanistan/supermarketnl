import api, { request } from './api';
import { localDb } from './localDb';

export const faqService = {
  getFaqs: async () => {
    return request(
      async () => {
        const response = await api.get('/faqs');
        return { data: response.data.data };
      },
      () => localDb.getFaqs()
    );
  },

  createFaq: async (faqData) => {
    return request(
      async () => {
        const response = await api.post('/faqs', faqData);
        return { data: response.data.data };
      },
      () => {
        const faqs = localDb.getFaqs();
        const newFaq = {
          id: Date.now().toString(),
          ...faqData,
        };
        faqs.push(newFaq);
        localDb.saveFaqs(faqs);
        return newFaq;
      }
    );
  },

  updateFaq: async (id, faqData) => {
    return request(
      async () => {
        const response = await api.put(`/faqs/${id}`, faqData);
        return { data: response.data.data };
      },
      () => {
        const faqs = localDb.getFaqs();
        const idx = faqs.findIndex((f) => f.id === id);
        if (idx === -1) throw new Error('FAQ not found');
        
        faqs[idx] = { ...faqs[idx], ...faqData };
        localDb.saveFaqs(faqs);
        return faqs[idx];
      }
    );
  },

  deleteFaq: async (id) => {
    return request(
      () => api.delete(`/faqs/${id}`),
      () => {
        const faqs = localDb.getFaqs();
        const filtered = faqs.filter((f) => f.id !== id);
        localDb.saveFaqs(filtered);
        return { success: true };
      }
    );
  },
};

export default faqService;
