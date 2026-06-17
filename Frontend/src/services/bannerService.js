import api, { request } from './api';
import { localDb } from './localDb';

export const bannerService = {
  getBanners: async () => {
    return request(
      async () => {
        const response = await api.get('/banners');
        return { data: response.data.data };
      },
      () => localDb.getBanners()
    );
  },

  createBanner: async (bannerData) => {
    return request(
      async () => {
        const config = bannerData instanceof FormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : {};
        const response = await api.post('/banners', bannerData, config);
        return { data: response.data.data };
      },
      () => {
        const banners = localDb.getBanners();
        const newBanner = {
          id: Date.now().toString(),
          ...bannerData,
        };
        banners.push(newBanner);
        localDb.saveBanners(banners);
        return newBanner;
      }
    );
  },

  updateBanner: async (id, bannerData) => {
    return request(
      async () => {
        const config = bannerData instanceof FormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : {};
        const response = await api.put(`/banners/${id}`, bannerData, config);
        return { data: response.data.data };
      },
      () => {
        const banners = localDb.getBanners();
        const idx = banners.findIndex((b) => b.id === id);
        if (idx === -1) throw new Error('Banner not found');
        
        banners[idx] = { ...banners[idx], ...bannerData };
        localDb.saveBanners(banners);
        return banners[idx];
      }
    );
  },

  deleteBanner: async (id) => {
    return request(
      () => api.delete(`/banners/${id}`),
      () => {
        const banners = localDb.getBanners();
        const filtered = banners.filter((b) => b.id !== id);
        localDb.saveBanners(filtered);
        return { success: true };
      }
    );
  },
};

export default bannerService;
