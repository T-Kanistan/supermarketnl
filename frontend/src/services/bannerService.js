import api, { apiRequest } from './api';

const toPayload = (data) => ({
  headingLine1: data.headingLine1 ?? data.title,
  headingLine2: data.headingLine2 ?? data.highlightText,
  headingLine3: data.headingLine3 ?? data.titleLine2,
  subtitle: data.subtitle,
  primaryButtonLabel: data.primaryButtonLabel ?? data.buttonText,
  primaryButtonLink: data.primaryButtonLink ?? data.buttonLink,
  secondaryButtonLabel: data.secondaryButtonLabel ?? data.buttonText2,
  secondaryButtonLink: data.secondaryButtonLink ?? data.buttonLink2,
  backgroundImage: data.backgroundImage ?? data.image,
  status: data.status || 'active',
  showOpenTimeCard: data.showOpenTimeCard ?? data.showOpenTime ?? true,
  cardTitle: data.cardTitle ?? data.openTimeTitle,
  supermarketLabel: data.supermarketLabel,
  supermarketHours: data.supermarketHours ?? data.supermarketTimings,
  foodCornerLabel: data.foodCornerLabel,
  foodCornerHours: data.foodCornerHours ?? data.foodCornerTimings,
});

export const bannerService = {
  getStorefrontBanner: async () => apiRequest(() => api.get('/storefront/home-banner')),

  getActiveBanner: async () => apiRequest(() => api.get('/home-banner/active')),

  getBanners: async () => {
    try {
      const banner = await apiRequest(() => api.get('/storefront/home-banner'));
      return banner ? [banner] : [];
    } catch {
      return [];
    }
  },

  getAllBanners: async () => apiRequest(() => api.get('/home-banner')),

  getBannerPreview: async (id) => apiRequest(() => api.get(`/home-banner/preview/${id}`)),

  uploadBannerImage: async (file) => {
    const formData = new FormData();
    formData.append('image', file);
    const response = await api.post('/upload/home-banner', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data.imageUrl;
  },

  createBanner: async (bannerData) => {
    const payload = toPayload(bannerData);
    return apiRequest(() => api.post('/home-banner', payload));
  },

  updateBanner: async (id, bannerData) => {
    const payload = toPayload(bannerData);
    return apiRequest(() => api.put(`/home-banner/${id}`, payload));
  },

  deleteBanner: async (id) => apiRequest(() => api.delete(`/home-banner/${id}`)),
};

export default bannerService;
