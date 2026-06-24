import api, { apiRequest } from './api';

const appendField = (formData, key, value) => {
  if (value === undefined || value === null) return;
  formData.append(key, typeof value === 'boolean' ? String(value) : String(value));
};

const toFormPayload = (data) => {
  const formData = new FormData();
  appendField(formData, 'pageType', data.pageType || data.pageName);
  appendField(formData, 'badgeText', data.badgeText);
  appendField(formData, 'title', data.title || data.mainHeading);
  appendField(formData, 'highlightedTitle', data.highlightedTitle || data.highlightText);
  appendField(formData, 'description', data.description);
  appendField(formData, 'buttonText', data.buttonText || data.button1Text);
  appendField(formData, 'buttonUrl', data.buttonUrl || data.button1Url);
  appendField(formData, 'sideCardTitle', data.sideCardTitle);
  appendField(formData, 'sideCardDescription', data.sideCardDescription);
  appendField(formData, 'sideCardIcon', data.sideCardIcon);
  appendField(formData, 'overlayColor', data.overlayColor);
  appendField(formData, 'overlayOpacity', data.overlayOpacity);
  appendField(formData, 'displayOrder', data.displayOrder);
  appendField(formData, 'isActive', data.isActive);
  const imageValue = data.backgroundImage || data.image;
  if (imageValue && !String(imageValue).startsWith('blob:')) {
    appendField(formData, 'backgroundImage', imageValue);
  }
  return formData;
};

export const bannerService = {
  getBannerByPage: async (pageType) => {
    try {
      return await apiRequest(() => api.get(`/banners/page/${pageType}`));
    } catch {
      return null;
    }
  },

  getStorefrontBanner: async () => bannerService.getBannerByPage('home'),

  listBanners: async (params = {}) => {
    const query = {
      ...params,
      pageType: params.pageType || params.pageName,
    };
    delete query.pageName;
    const response = await api.get('/banners', { params: query });
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

  updateBannerStatus: async (id, isActive) => {
    const response = await api.patch(`/banners/${id}/status`, { isActive });
    return response.data?.data;
  },

  deleteBanner: async (id) => apiRequest(() => api.delete(`/banners/${id}`)),

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
