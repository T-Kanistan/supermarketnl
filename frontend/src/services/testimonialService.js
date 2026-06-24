import api, { apiRequest } from './api';

export const DEFAULT_AVATAR = '/default-avatar.png';

const mapTestimonial = (item) => ({
  ...item,
  avatarImage: item.avatarImage || item.image || DEFAULT_AVATAR,
  image: item.avatarImage || item.image || DEFAULT_AVATAR,
});

export const testimonialService = {
  getStorefrontTestimonials: async () => {
    const data = await apiRequest(() => api.get('/storefront/testimonials'));
    return Array.isArray(data) ? data.map(mapTestimonial) : [];
  },

  getAllTestimonials: async () => {
    const data = await apiRequest(() => api.get('/testimonials'));
    return Array.isArray(data) ? data.map(mapTestimonial) : [];
  },

  searchTestimonials: async (query) => {
    const data = await apiRequest(() =>
      api.get('/testimonials/search', { params: { q: query } })
    );
    return Array.isArray(data) ? data.map(mapTestimonial) : [];
  },

  getTestimonialById: async (id) => {
    const data = await apiRequest(() => api.get(`/testimonials/${id}`));
    return mapTestimonial(data);
  },

  uploadAvatar: async (file) => {
    const formData = new FormData();
    formData.append('image', file);
    const response = await api.post('/upload/testimonial-avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data.imageUrl;
  },

  createTestimonial: async (testimonialData) =>
    apiRequest(() => api.post('/testimonials', testimonialData)),

  updateTestimonial: async (id, testimonialData) =>
    apiRequest(() => api.put(`/testimonials/${id}`, testimonialData)),

  deleteTestimonial: async (id) => apiRequest(() => api.delete(`/testimonials/${id}`)),
};

export default testimonialService;
