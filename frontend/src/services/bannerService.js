import api, { apiRequest } from './api';

const appendField = (formData, key, value) => {
  if (value === undefined || value === null) return;
  formData.append(key, typeof value === 'boolean' ? String(value) : String(value));
};

const toFormPayload = (data) => {
  const formData = new FormData();
  appendField(formData, 'pageName', data.pageName);
  appendField(formData, 'badgeText', data.badgeText);
  appendField(formData, 'mainHeading', data.mainHeading);
  appendField(formData, 'highlightText', data.highlightText);
  appendField(formData, 'description', data.description);
  appendField(formData, 'button1Text', data.button1Text);
  appendField(formData, 'button1Url', data.button1Url);
  appendField(formData, 'button2Text', data.button2Text);
  appendField(formData, 'button2Url', data.button2Url);
  appendField(formData, 'overlayColor', data.overlayColor);
  appendField(formData, 'overlayOpacity', data.overlayOpacity);
  appendField(formData, 'displayOrder', data.displayOrder);
  appendField(formData, 'isActive', data.isActive);
  if (data.image && !String(data.image).startsWith('blob:')) {
    appendField(formData, 'image', data.image);
  }
  return formData;
};

export const bannerService = {
  getBannerByPage: async (pageName) => {
    try {
      return await apiRequest(() => api.get(`/banners/page/${pageName}`));
    } catch {
      return null;
    }
  },

  getStorefrontBanner: async () => bannerService.getBannerByPage('home'),

  listBanners: async (params = {}) => {
    const response = await api.get('/banners', { params });
    return {
      data: response.data?.data || [],
      pagination: response.data?.pagination || {
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 1,
      },
    };
  },

  getBannerById: async (id) => apiRequest(() => api.get(`/banners/${id}`)),

  uploadBannerImage: async (file) => {
    const formData = new FormData();
    formData.append('image', file);
    const response = await api.post('/upload/banner', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data.imageUrl;
  },

  createBanner: async (bannerData, imageFile = null) => {
    const formData = toFormPayload(bannerData);
    if (imageFile) {
      formData.append('image', imageFile);
    }
    const response = await api.post('/banners', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data?.data;
  },

  updateBanner: async (id, bannerData, imageFile = null) => {
    const formData = toFormPayload(bannerData);
    if (imageFile) {
      formData.append('image', imageFile);
    }
    const response = await api.put(`/banners/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data?.data;
  },

  deleteBanner: async (id) => apiRequest(() => api.delete(`/banners/${id}`)),

  // Legacy helpers
  getAllBanners: async () => {
    const result = await bannerService.listBanners({ limit: 100 });
    return result.data;
  },

  getBanners: async () => {
    const banner = await bannerService.getStorefrontBanner();
    return banner ? [banner] : [];
  },
};

export default bannerService;
