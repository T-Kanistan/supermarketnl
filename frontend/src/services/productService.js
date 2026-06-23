import api, { request } from './api';
import { localDb } from './localDb';

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
    featuredProduct: Boolean(data.featuredProduct ?? data.isFeatured ?? data.featured),
    status: data.status || 'active',
  };

  if (productType === 'grocery') {
    payload.stockStatus =
      data.stockStatus ||
      (data.stock > 0 || data.stock === 'in_stock' ? 'in_stock' : 'out_of_stock');
    payload.weightUnit = data.weightUnit || data.weightUnitSize || data.weight || '';
  } else {
    payload.menuDisplayTiming = data.menuDisplayTiming || data.displayTime || '';
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
  if (data.featuredProduct !== undefined || data.isFeatured !== undefined || data.featured !== undefined) {
    payload.featuredProduct = Boolean(data.featuredProduct ?? data.isFeatured ?? data.featured);
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
  } else if (data.menuDisplayTiming !== undefined || data.displayTime !== undefined) {
    payload.menuDisplayTiming = data.menuDisplayTiming || data.displayTime || '';
  }

  return payload;
};

export const productService = {
  getProducts: async (params = {}) => {
    const { admin, ...query } = params;
    const endpoint = admin ? '/products/all' : '/products';

    return request(
      async () => {
        const response = await api.get(endpoint, { params: query });
        return response.data.data ?? response.data;
      },
      () => {
        let products = localDb.getProducts();
        if (params.type || params.productType) {
          const type = mapProductType(params.productType || params.type);
          products = products.filter((p) => mapProductType(p.productType || p.type) === type);
        }
        if (params.categoryId && params.categoryId !== 'all') {
          products = products.filter((p) => p.categoryId === params.categoryId);
        }
        if (params.search) {
          const q = params.search.toLowerCase();
          products = products.filter((p) => (p.productName || p.name).toLowerCase().includes(q));
        }
        return products;
      }
    );
  },

  getFeaturedProducts: async () => {
    return request(
      async () => {
        const response = await api.get('/products/featured');
        return response.data.data ?? response.data;
      },
      () => localDb.getProducts().filter((p) => p.isFeatured || p.featuredProduct)
    );
  },

  getProductCategories: async (productType) => {
    return request(
      async () => {
        const response = await api.get('/products/categories', {
          params: { productType: mapProductType(productType) },
        });
        return response.data.data ?? response.data;
      },
      () => []
    );
  },

  getProductById: async (id) => {
    return request(
      async () => {
        const response = await api.get(`/products/${id}`);
        return response.data.data ?? response.data;
      },
      () => localDb.getProducts().find((p) => p.id === id)
    );
  },

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
    return request(
      async () => {
        try {
          const response = await api.post('/products', payload);
          return response.data.data ?? response.data;
        } catch (error) {
          throw new Error(extractApiError(error, 'Failed to create product'));
        }
      },
      () => {
        const products = localDb.getProducts();
        const newProduct = {
          id: Date.now().toString(),
          status: 'active',
          featuredProduct: false,
          ...payload,
        };
        products.push(newProduct);
        localDb.saveProducts(products);
        return newProduct;
      }
    );
  },

  updateProduct: async (id, productData) => {
    const payload = toUpdatePayload(productData);

    return request(
      async () => {
        try {
          const response = await api.put(`/products/${id}`, payload);
          return response.data.data ?? response.data;
        } catch (error) {
          throw new Error(extractApiError(error, 'Failed to update product'));
        }
      },
      () => {
        const products = localDb.getProducts();
        const idx = products.findIndex((p) => p.id === id);
        if (idx === -1) throw new Error('Product not found');
        products[idx] = { ...products[idx], ...payload };
        localDb.saveProducts(products);
        return products[idx];
      }
    );
  },

  deleteProduct: async (id) => {
    return request(
      () => api.delete(`/products/${id}`),
      () => {
        const products = localDb.getProducts();
        localDb.saveProducts(products.filter((p) => p.id !== id));
        return { success: true };
      }
    );
  },

  getFoodCornerItems: async (params = {}) => {
    return productService.getProducts({ ...params, productType: 'food-corner' });
  },
};

export default productService;
