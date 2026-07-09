import api, { apiRequest } from './api';

const mapProductType = (value) => {
  const raw = value == null ? '' : String(value).trim().toLowerCase();
  if (!raw) return 'grocery';
  if (raw === 'food' || raw === 'food-corner' || raw === 'food corner' || raw === 'foodcorner') return 'food-corner';
  return 'grocery';
};

const extractApiError = (error, fallback = 'Request failed') => {
  const data = error?.response?.data;
  if (!data) return error?.message || fallback;
  if (data.message && data.message !== 'Validation failed') return data.message;
  if (Array.isArray(data.errors) && data.errors.length > 0) {
    return data.errors.map((entry) => entry.message).join('; ');
  }
  return data.message || fallback;
};

const toApiPayload = (data) => {
  const productType = mapProductType(data.productType || data.type || data.productCatalogType);
  const payload = {
    productType,
    productName: data.productName || data.name,
    categoryId: data.categoryId || data.category || data.categoryName,
    price: Number(data.price),
    imageUrl: data.imageUrl || data.image,
    status: data.status || 'active',
  };

  if (productType === 'grocery') {
    const featured = Boolean(data.showOnHomepage ?? data.featuredProduct ?? data.isFeatured ?? data.featured);
    payload.showOnHomepage = featured;
    payload.featuredProduct = featured;
    payload.stockStatus =
      data.stockStatus ||
      (data.stock > 0 || data.stock === 'in_stock' ? 'in_stock' : 'out_of_stock');
    payload.weightUnit = data.weightUnit || data.weightUnitSize || data.weight || '';
  } else {
    payload.menuDisplayTiming = data.menuDisplayTiming || data.displayTime || '';
    payload.description = data.description || data.shortDescription || '';
    payload.showOnHomepage = false;
    payload.featuredProduct = false;
  }

  return payload;
};

const toUpdatePayload = (data) => {
  const payload = {};
  const productType = mapProductType(data.productType || data.type || data.productCatalogType || 'grocery');

  if (data.productType !== undefined || data.type !== undefined || data.productCatalogType !== undefined) {
    payload.productType = productType;
  }
  if (data.productName !== undefined || data.name !== undefined) {
    payload.productName = data.productName || data.name;
  }
  if (data.categoryId !== undefined || data.category !== undefined || data.categoryName !== undefined) {
    payload.categoryId = data.categoryId || data.category || data.categoryName;
  }
  if (data.price !== undefined) {
    payload.price = Number(data.price);
  }
  if (data.imageUrl !== undefined || data.image !== undefined) {
    payload.imageUrl = data.imageUrl || data.image;
  }
  if (data.status !== undefined) {
    payload.status = data.status;
  }

  const resolvedType = payload.productType || productType;
  if (resolvedType === 'grocery') {
    if (data.stockStatus !== undefined) {
      payload.stockStatus = data.stockStatus;
    }
    if (data.weightUnit !== undefined || data.weightUnitSize !== undefined || data.weight !== undefined) {
      payload.weightUnit = data.weightUnit || data.weightUnitSize || data.weight || '';
    }
    if (
      data.showOnHomepage !== undefined ||
      data.featuredProduct !== undefined ||
      data.isFeatured !== undefined ||
      data.featured !== undefined
    ) {
      const featured = Boolean(
        data.showOnHomepage ?? data.featuredProduct ?? data.isFeatured ?? data.featured
      );
      payload.showOnHomepage = featured;
      payload.featuredProduct = featured;
    }
  } else if (resolvedType === 'food-corner') {
    if (data.menuDisplayTiming !== undefined || data.displayTime !== undefined) {
      payload.menuDisplayTiming = data.menuDisplayTiming || data.displayTime || '';
    }
    if (data.description !== undefined || data.shortDescription !== undefined) {
      payload.description = data.description || data.shortDescription || '';
    }
    if (data.productType !== undefined || data.type !== undefined || data.productCatalogType !== undefined) {
      payload.showOnHomepage = false;
      payload.featuredProduct = false;
    }
  }

  return payload;
};

export const productService = {
  getProducts: async (params = {}) => {
    const { admin, ...query } = params;
    const endpoint = admin ? '/products/all' : '/products';
    return apiRequest(() => api.get(endpoint, { params: query }));
  },

  getFeaturedProducts: async () => apiRequest(() => api.get('/products/featured')),

  getProductCategories: async (productType) =>
    apiRequest(() =>
      api.get('/products/categories', { params: { productType: mapProductType(productType) } })
    ),

  getProductById: async (id) => apiRequest(() => api.get(`/products/${id}`)),

  uploadProductImage: async (file) => {
    const formData = new FormData();
    formData.append('image', file);
    const response = await api.post('/upload/product-image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data.imageUrl;
  },

  createProduct: async (productData) => {
    const payload = toApiPayload(productData);
    try {
      return await apiRequest(() => api.post('/products', payload));
    } catch (error) {
      throw new Error(extractApiError(error, 'Failed to create product'));
    }
  },

  updateProduct: async (id, productData) => {
    const payload = toUpdatePayload(productData);
    try {
      return await apiRequest(() => api.put(`/products/${id}`, payload));
    } catch (error) {
      throw new Error(extractApiError(error, 'Failed to update product'));
    }
  },

  updateProductStatus: async (id, status) => {
    try {
      return await apiRequest(() => api.patch(`/products/${id}/status`, { status }));
    } catch (error) {
      throw new Error(extractApiError(error, 'Failed to update product status'));
    }
  },

  deleteProduct: async (id) => apiRequest(() => api.delete(`/products/${id}`)),

  batchAdjustPrices: async (adjustmentData) => {
    try {
      return await apiRequest(() => api.post('/products/batch-adjust-prices', adjustmentData));
    } catch (error) {
      throw new Error(extractApiError(error, 'Failed to adjust prices'));
    }
  },

  getFoodCornerItems: async (params = {}) => {
    return productService.getProducts({ ...params, productType: 'food-corner' });
  },
};

export default productService;
