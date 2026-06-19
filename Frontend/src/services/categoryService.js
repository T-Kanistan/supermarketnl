import api, { request } from './api';
import { localDb } from './localDb';

export const categoryService = {
  getCategories: async (params = {}) => {
    const endpoint = params.admin ? '/categories/all' : '/categories';

    return request(
      async () => {
        const response = await api.get(endpoint);
        return response.data.data ?? response.data;
      },
      () => localDb.getCategories()
    );
  },

  createCategory: async (categoryData) => {
    return request(
      async () => {
        const response = await api.post('/categories', categoryData);
        return response.data.data ?? response.data;
      },
      () => {
        const categories = localDb.getCategories();
        const newCat = {
          id: categoryData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          ...categoryData,
        };
        categories.push(newCat);
        localDb.saveCategories(categories);
        return newCat;
      }
    );
  },

  updateCategory: async (id, categoryData) => {
    return request(
      async () => {
        const response = await api.put(`/categories/${id}`, categoryData);
        return response.data.data ?? response.data;
      },
      () => {
        const categories = localDb.getCategories();
        const idx = categories.findIndex((c) => c.id === id);
        if (idx === -1) throw new Error('Category not found');
        
        categories[idx] = { ...categories[idx], ...categoryData };
        localDb.saveCategories(categories);
        return categories[idx];
      }
    );
  },

  deleteCategory: async (id) => {
    return request(
      () => api.delete(`/categories/${id}`),
      () => {
        const categories = localDb.getCategories();
        const filtered = categories.filter((c) => c.id !== id);
        localDb.saveCategories(filtered);
        return { success: true };
      }
    );
  },
};

export default categoryService;
