import api, { apiRequest } from './api';

const normalizeCategory = (cat) => ({
  ...cat,
  id: cat.id || cat._id?.toString?.() || cat.slug,
  categoryName: cat.categoryName || cat.name || '',
  name: cat.categoryName || cat.name || '',
  status: typeof cat.status === 'boolean' ? cat.status : cat.status === 'active',
});

export const foodCornerCategoryService = {
  getCategories: async (params = {}) => {
    if (params.public) {
      const data = await apiRequest(() => api.get('/food-corner/public/categories'));
      return Array.isArray(data) ? data.map(normalizeCategory) : [];
    }

    const response = await api.get('/food-corner/categories', { params });
    const payload = response.data;
    const rows = payload?.data ?? payload;
    return {
      data: Array.isArray(rows) ? rows.map(normalizeCategory) : [],
      pagination: payload?.pagination || null,
    };
  },

  getCategoryById: async (id) => {
    const data = await apiRequest(() => api.get(`/food-corner/categories/${id}`));
    return normalizeCategory(data);
  },

  createCategory: async (categoryData) => {
    const payload = {
      ...categoryData,
      categoryName: categoryData.categoryName || categoryData.name,
    };
    const data = await apiRequest(() => api.post('/food-corner/categories', payload));
    return normalizeCategory(data);
  },

  updateCategory: async (id, categoryData) => {
    const payload = {
      ...categoryData,
      categoryName: categoryData.categoryName || categoryData.name,
    };
    const data = await apiRequest(() => api.put(`/food-corner/categories/${id}`, payload));
    return normalizeCategory(data);
  },

  toggleCategoryStatus: async (id, status) => {
    const data = await apiRequest(() =>
      api.patch(`/food-corner/categories/${id}/status`, { status })
    );
    return normalizeCategory(data);
  },

  deleteCategory: async (id) => {
    const data = await apiRequest(() => api.delete(`/food-corner/categories/${id}`));
    return data ?? { success: true };
  },
};

export default foodCornerCategoryService;
