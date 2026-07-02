import api, { apiRequest } from './api';

export const foodCornerService = {
  getItems: async (categorySlug = 'all') => {
    const params = {};
    if (categorySlug && categorySlug !== 'all') {
      params.category = categorySlug;
    }
    const data = await apiRequest(() => api.get('/food-corner/items', { params }));
    return Array.isArray(data) ? data : [];
  },

  getCategories: async () => {
    const data = await apiRequest(() => api.get('/food-corner/public/categories'));
    return Array.isArray(data) ? data : [];
  },
};

export default foodCornerService;
