import api, { apiRequest } from './api';
import { localDb } from './localDb';

const mapLocalItem = (item, categories) => {
  const category = categories.find(
    (cat) =>
      cat.slug === item.categoryId ||
      cat.id === item.categoryId ||
      cat.categoryName === item.categoryId ||
      cat.categoryName === item.categoryName
  );

  return {
    id: item.id,
    name: item.name,
    description: item.description || '',
    categoryId: item.categoryId,
    categorySlug: category?.slug || item.categoryId || '',
    categoryName: category?.categoryName || item.categoryName || item.categoryId,
    price: item.price,
    image: item.image,
    displayTime: item.displayTime || 'All Day',
    badge: item.badge || '',
    stock: item.stock ?? 0,
    isAvailable: (item.stock ?? 0) > 0,
    status: item.status,
    rating: item.rating,
    reviews: item.reviews,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
};

export const foodCornerService = {
  getItems: async (categorySlug = 'all') => {
    const params = {};
    if (categorySlug && categorySlug !== 'all') {
      params.category = categorySlug;
    }

    return apiRequest(
      async () => {
        const response = await api.get('/food-corner/items', { params });
        const data = response.data?.data ?? response.data;
        return Array.isArray(data) ? data : [];
      },
      () => {
        const categories = localDb
          .getFoodCornerCategories()
          .filter((cat) => cat.status === true || cat.status === 'active');
        let items = localDb
          .getProducts()
          .filter(
            (p) =>
              (p.productType === 'food-corner' || p.type === 'food' || p.type === 'food-corner') &&
              p.status === 'active'
          );

        if (categorySlug && categorySlug !== 'all') {
          items = items.filter(
            (p) => p.categoryId === categorySlug || categories.find((c) => c.slug === categorySlug)?.name === p.categoryId
          );
        }

        items = items.filter((item) =>
          categories.some(
            (cat) => cat.slug === item.categoryId || cat.categoryName === item.categoryId || cat.id === item.categoryId
          )
        );

        return items.map((item) => mapLocalItem(item, categories));
      }
    );
  },

  getCategories: async () => {
    return apiRequest(
      async () => {
        const response = await api.get('/food-corner/public/categories');
        const data = response.data?.data ?? response.data;
        return Array.isArray(data) ? data : [];
      },
      () =>
        localDb
          .getFoodCornerCategories()
          .filter((cat) => cat.status === true || cat.status === 'active')
          .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))
    );
  },
};

export default foodCornerService;
