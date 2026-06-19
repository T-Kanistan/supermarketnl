import api, { request } from './api';
import { localDb } from './localDb';

export const feedbackService = {
  getTestimonials: async () => {
    return request(
      async () => {
        const response = await api.get('/testimonials');
        return { data: response.data.data };
      },
      () => localDb.getTestimonials()
    );
  },

  createTestimonial: async (testimonialData) => {
    return request(
      async () => {
        const config = testimonialData instanceof FormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : {};
        const response = await api.post('/testimonials', testimonialData, config);
        return { data: response.data.data };
      },
      () => {
        const testimonials = localDb.getTestimonials();
        const newTestimonial = {
          id: Date.now().toString(),
          ...testimonialData,
          rating: Number(testimonialData.rating) || 5,
        };
        testimonials.push(newTestimonial);
        localDb.saveTestimonials(testimonials);
        return newTestimonial;
      }
    );
  },

  updateTestimonial: async (id, testimonialData) => {
    return request(
      async () => {
        const config = testimonialData instanceof FormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : {};
        const response = await api.put(`/testimonials/${id}`, testimonialData, config);
        return { data: response.data.data };
      },
      () => {
        const testimonials = localDb.getTestimonials();
        const idx = testimonials.findIndex((t) => t.id === id);
        if (idx === -1) throw new Error('Testimonial not found');
        
        testimonials[idx] = { 
          ...testimonials[idx], 
          ...testimonialData,
          rating: Number(testimonialData.rating) || 5,
        };
        localDb.saveTestimonials(testimonials);
        return testimonials[idx];
      }
    );
  },

  deleteTestimonial: async (id) => {
    return request(
      () => api.delete(`/testimonials/${id}`),
      () => {
        const testimonials = localDb.getTestimonials();
        const filtered = testimonials.filter((t) => t.id !== id);
        localDb.saveTestimonials(filtered);
        return { success: true };
      }
    );
  },
};

export default feedbackService;
