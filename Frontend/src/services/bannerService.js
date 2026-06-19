import api, { apiRequest } from './api';

export const bannerService = {
  getBanners: async () => apiRequest(() => api.get('/banners')),

  getAllBanners: async () => {
    return apiRequest(() => api.get('/banners/all'));
  },

  createBanner: async (bannerData) => {
    return apiRequest(() => {
      const config = bannerData instanceof FormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : {};
      return api.post('/banners', bannerData, config);
    });
  },

  updateBanner: async (id, bannerData) => {
    return apiRequest(() => {
      const config = bannerData instanceof FormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : {};
      return api.put(`/banners/${id}`, bannerData, config);
    });
  },

  deleteBanner: async (id) => apiRequest(() => api.delete(`/banners/${id}`)),
};

export default bannerService;
