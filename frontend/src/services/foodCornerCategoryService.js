import api, { request } from './api';
import { localDb } from './localDb';

const slugify = (value) =>
  String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

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
      return request(
        async () => {
          const response = await api.get('/food-corner/public/categories');
          const data = response.data?.data ?? response.data;
          return Array.isArray(data) ? data.map(normalizeCategory) : [];
        },
        () =>
          localDb
            .getFoodCornerCategories()
            .filter((cat) => cat.status === true || cat.status === 'active')
            .map(normalizeCategory)
      );
    }

    return request(
      async () => {
        const response = await api.get('/food-corner/categories', { params });
        const payload = response.data;
        const rows = payload?.data ?? payload;
        return {
          data: Array.isArray(rows) ? rows.map(normalizeCategory) : [],
          pagination: payload?.pagination || null,
        };
      },
      () => {
        let categories = localDb.getFoodCornerCategories().map(normalizeCategory);

        if (params.search) {
          const q = String(params.search).toLowerCase();
          categories = categories.filter(
            (cat) =>
              cat.categoryName.toLowerCase().includes(q) ||
              cat.slug.toLowerCase().includes(q)
          );
        }

        if (params.status === 'true' || params.status === true) {
          categories = categories.filter((cat) => cat.status === true);
        } else if (params.status === 'false' || params.status === false) {
          categories = categories.filter((cat) => cat.status === false);
        }

        return { data: categories, pagination: null };
      }
    );
  },

  getCategoryById: async (id) => {
    return request(
      async () => {
        const response = await api.get(`/food-corner/categories/${id}`);
        return normalizeCategory(response.data.data ?? response.data);
      },
      () => {
        const categories = localDb.getFoodCornerCategories().map(normalizeCategory);
        return (
          categories.find((cat) => cat.id === id || cat.slug === id || cat._id === id) ||
          null
        );
      }
    );
  },

  createCategory: async (categoryData) => {
    const payload = {
      ...categoryData,
      categoryName: categoryData.categoryName || categoryData.name,
    };

    return request(
      async () => {
        const response = await api.post('/food-corner/categories', payload);
        return normalizeCategory(response.data.data ?? response.data);
      },
      () => {
        const categories = localDb.getFoodCornerCategories();
        const slug = payload.slug || slugify(payload.categoryName);
        if (categories.some((cat) => cat.slug === slug)) {
          throw new Error('Category slug must be unique');
        }
        if (
          categories.some(
            (cat) =>
              (cat.categoryName || cat.name).toLowerCase() ===
              String(payload.categoryName || '').toLowerCase()
          )
        ) {
          throw new Error('Category name must be unique');
        }

        const newCategory = normalizeCategory({
          id: slug,
          slug,
          status: true,
          displayOrder: 0,
          icon: '',
          description: '',
          ...payload,
        });
        categories.push(newCategory);
        localDb.saveFoodCornerCategories(categories);
        return newCategory;
      }
    );
  },

  updateCategory: async (id, categoryData) => {
    const payload = {
      ...categoryData,
      categoryName: categoryData.categoryName || categoryData.name,
    };

    return request(
      async () => {
        const response = await api.put(`/food-corner/categories/${id}`, payload);
        return normalizeCategory(response.data.data ?? response.data);
      },
      () => {
        const categories = localDb.getFoodCornerCategories();
        const idx = categories.findIndex((cat) => cat.id === id || cat.slug === id);
        if (idx === -1) throw new Error('Category not found');

        categories[idx] = normalizeCategory({
          ...categories[idx],
          ...payload,
          id: payload.slug || categories[idx].slug,
          slug: payload.slug || categories[idx].slug,
        });
        localDb.saveFoodCornerCategories(categories);
        return categories[idx];
      }
    );
  },

  toggleCategoryStatus: async (id, status) => {
    return request(
      async () => {
        const response = await api.patch(`/food-corner/categories/${id}/status`, {
          status,
        });
        return normalizeCategory(response.data.data ?? response.data);
      },
      () => {
        const categories = localDb.getFoodCornerCategories();
        const idx = categories.findIndex((cat) => cat.id === id || cat.slug === id);
        if (idx === -1) throw new Error('Category not found');
        categories[idx].status =
          status !== undefined ? Boolean(status) : !categories[idx].status;
        localDb.saveFoodCornerCategories(categories);
        return normalizeCategory(categories[idx]);
      }
    );
  },

  deleteCategory: async (id) => {
    return request(
      async () => {
        const response = await api.delete(`/food-corner/categories/${id}`);
        return response.data ?? { success: true };
      },
      () => {
        const categories = localDb.getFoodCornerCategories();
        const category = categories.find((cat) => cat.id === id || cat.slug === id);
        if (!category) throw new Error('Category not found');

        const linkedCount = localDb
          .getProducts()
          .filter(
            (product) =>
              product.type === 'food' &&
              (product.categoryId === category.id ||
                product.categoryId === category.slug ||
                product.categoryName === category.categoryName)
          ).length;

        if (linkedCount > 0) {
          throw new Error(`Cannot delete category linked to ${linkedCount} Food Corner item(s)`);
        }

        const filtered = categories.filter((cat) => cat.id !== id && cat.slug !== id);
        localDb.saveFoodCornerCategories(filtered);
        return { success: true };
      }
    );
  },
};

export default foodCornerCategoryService;
