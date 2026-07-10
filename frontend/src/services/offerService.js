import api from './api';

const extractApiError = (error, fallback = 'Request failed') => {
  const data = error?.response?.data;
  if (!data) return error?.message || fallback;
  if (data.message && data.message !== 'Validation failed') return data.message;
  if (Array.isArray(data.errors) && data.errors.length > 0) {
    return data.errors.map((entry) => entry.message).join('; ');
  }
  return data.message || fallback;
};

const unwrap = (response) => response?.data?.data ?? response?.data;

const toNullableNumber = (value) => {
  if (value === undefined || value === null || value === '') return null;
  const num = Number(value);
  return Number.isNaN(num) ? null : num;
};

const toPayload = (data) => {
  const payload = {
    title: data.title?.trim() ?? '',
    subtitle: data.subtitle?.trim() ?? '',
    description: data.description?.trim() ?? '',
    category: data.category?.trim() ?? '',
    offerDepartment: data.offerDepartment || data.offerType || 'Supermarket',
    discountType: data.discountType || 'percentage',
    discountValue: toNullableNumber(data.discountValue),
    originalPrice: toNullableNumber(data.originalPrice),
    offerPrice: toNullableNumber(data.offerPrice),
    offerBadge: data.offerBadge?.trim() ?? '',
    image: data.image || data.imageUrl || '',
    bannerImage: data.bannerImage || '',
    startDate: data.startDate || null,
    endDate: data.endDate || null,
    buttonText: data.buttonText?.trim() || 'Shop Now',
    buttonLink: data.buttonLink?.trim() ?? '',
    featured: Boolean(data.featured),
    status: data.status || 'active',
    sortOrder: toNullableNumber(data.sortOrder) ?? 0,
  };
  return payload;
};

const offerService = {
  getOffers: async (params = {}) => {
    const { admin, ...query } = params;
    const endpoint = admin ? '/offers/all' : '/offers';
    const response = await api.get(endpoint, { params: { ...query, _t: Date.now() } });
    return unwrap(response);
  },

  getFeaturedOffers: async () => {
    const response = await api.get('/offers/featured');
    return unwrap(response);
  },

  getOfferCategories: async (params = {}) => {
    const response = await api.get('/offers/categories', { params });
    return unwrap(response);
  },

  // ----- Managed offer categories (admin) -----
  getOfferCategoriesAdmin: async () => {
    const response = await api.get('/offers/categories/manage');
    return unwrap(response);
  },

  createOfferCategory: async (categoryData) => {
    try {
      const response = await api.post('/offers/categories', categoryData);
      return unwrap(response);
    } catch (error) {
      throw new Error(extractApiError(error, 'Failed to create category'));
    }
  },

  updateOfferCategory: async (id, categoryData) => {
    try {
      const response = await api.put(`/offers/categories/${id}`, categoryData);
      return unwrap(response);
    } catch (error) {
      throw new Error(extractApiError(error, 'Failed to update category'));
    }
  },

  toggleOfferCategoryStatus: async (id, status) => {
    try {
      const response = await api.patch(`/offers/categories/${id}/status`, { status });
      return unwrap(response);
    } catch (error) {
      throw new Error(extractApiError(error, 'Failed to update category status'));
    }
  },

  deleteOfferCategory: async (id) => {
    try {
      const response = await api.delete(`/offers/categories/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(extractApiError(error, 'Failed to delete category'));
    }
  },

  getOffersByCategory: async (category) => {
    const response = await api.get(`/offers/category/${encodeURIComponent(category)}`);
    return unwrap(response);
  },

  getOfferById: async (id) => {
    const response = await api.get(`/offers/${id}`);
    return unwrap(response);
  },

  getBanner: async () => {
    const response = await api.get('/offers/banner', { params: { _t: Date.now() } });
    return unwrap(response);
  },

  getHeroBanners: async () => {
    const response = await api.get('/offers/hero-banners', { params: { _t: Date.now() } });
    return unwrap(response);
  },

  getHeroBannersAdmin: async (params = {}) => {
    const response = await api.get('/offers/hero-banners/manage', { params: { ...params, _t: Date.now() } });
    return unwrap(response);
  },

  createHeroBanner: async (bannerData) => {
    try {
      const response = await api.post('/offers/hero-banners', bannerData);
      return unwrap(response);
    } catch (error) {
      throw new Error(extractApiError(error, 'Failed to create hero banner'));
    }
  },

  updateHeroBanner: async (id, bannerData) => {
    try {
      const response = await api.put(`/offers/hero-banners/${id}`, bannerData);
      return unwrap(response);
    } catch (error) {
      throw new Error(extractApiError(error, 'Failed to update hero banner'));
    }
  },

  updateHeroBannerStatus: async (id, status) => {
    try {
      const response = await api.patch(`/offers/hero-banners/${id}/status`, { status });
      return unwrap(response);
    } catch (error) {
      throw new Error(extractApiError(error, 'Failed to update hero banner status'));
    }
  },

  deleteHeroBanner: async (id) => {
    try {
      const response = await api.delete(`/offers/hero-banners/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(extractApiError(error, 'Failed to delete hero banner'));
    }
  },

  updateBanner: async (bannerData) => {
    try {
      const response = await api.put('/offers/banner', bannerData);
      return unwrap(response);
    } catch (error) {
      throw new Error(extractApiError(error, 'Failed to update banner'));
    }
  },

  uploadOfferImage: async (file) => {
    const formData = new FormData();
    formData.append('image', file);
    const response = await api.post('/upload/offer-image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data.imageUrl;
  },

  createOffer: async (offerData) => {
    try {
      const response = await api.post('/offers', toPayload(offerData));
      return unwrap(response);
    } catch (error) {
      throw new Error(extractApiError(error, 'Failed to create offer'));
    }
  },

  updateOffer: async (id, offerData) => {
    try {
      const response = await api.put(`/offers/${id}`, toPayload(offerData));
      return unwrap(response);
    } catch (error) {
      throw new Error(extractApiError(error, 'Failed to update offer'));
    }
  },

  updateOfferStatus: async (id, status) => {
    try {
      const response = await api.patch(`/offers/${id}/status`, { status });
      return unwrap(response);
    } catch (error) {
      throw new Error(extractApiError(error, 'Failed to update offer status'));
    }
  },

  updateOfferPartial: async (id, partial) => {
    try {
      const response = await api.put(`/offers/${id}`, partial);
      return unwrap(response);
    } catch (error) {
      throw new Error(extractApiError(error, 'Failed to update offer'));
    }
  },

  deleteOffer: async (id) => {
    try {
      const response = await api.delete(`/offers/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(extractApiError(error, 'Failed to delete offer'));
    }
  },
};

export default offerService;
