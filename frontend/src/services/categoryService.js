import api, { apiRequest } from './api';

export const categoryService = {
  getCategories: async (params = {}) => {
    const endpoint = params.admin ? '/categories/all' : '/categories';
    return apiRequest(() => api.get(endpoint));
  },

  createCategory: async (categoryData) =>
    apiRequest(() => api.post('/categories', categoryData)),

  updateCategory: async (id, categoryData) =>
    apiRequest(() => api.put(`/categories/${id}`, categoryData)),

  deleteCategory: async (id) => apiRequest(() => api.delete(`/categories/${id}`)),
};

export default categoryService;
