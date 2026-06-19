import api, { request } from './api';
import { localDb } from './localDb';

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

        // Apply filters
        if (params.type) {
          products = products.filter((p) => p.type === params.type);
        }
        if (params.categoryId && params.categoryId !== 'all') {
          products = products.filter((p) => p.categoryId === params.categoryId);
        }
        if (params.search) {
          const q = params.search.toLowerCase();
          products = products.filter((p) => p.name.toLowerCase().includes(q));
        }
        if (params.isFeatured !== undefined) {
          const featuredVal = params.isFeatured === 'true' || params.isFeatured === true;
          products = products.filter((p) => p.isFeatured === featuredVal);
        }
        if (params.status) {
          products = products.filter((p) => p.status === params.status);
        }

        return products;
      }
    );
  },

  createProduct: async (productData) => {
    return request(
      async () => {
        const response = await api.post('/products', productData);
        return response.data.data ?? response.data;
      },
      () => {
        const products = localDb.getProducts();
        const newProduct = {
          id: Date.now().toString(),
          status: 'active',
          isFeatured: false,
          ...productData,
          price: Number(productData.price) || 0,
          stock: Number(productData.stock) || 0,
        };
        products.push(newProduct);
        localDb.saveProducts(products);
        return newProduct;
      }
    );
  },

  updateProduct: async (id, productData) => {
    return request(
      async () => {
        const response = await api.put(`/products/${id}`, productData);
        return response.data.data ?? response.data;
      },
      () => {
        const products = localDb.getProducts();
        const idx = products.findIndex((p) => p.id === id);
        if (idx === -1) throw new Error('Product not found');
        
        products[idx] = { 
          ...products[idx], 
          ...productData,
          price: Number(productData.price) || 0,
          stock: Number(productData.stock) || 0,
        };
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
        const filtered = products.filter((p) => p.id !== id);
        localDb.saveProducts(filtered);
        return { success: true };
      }
    );
  },

  getFoodCornerItems: async (params = {}) => {
    return productService.getProducts({ ...params, type: 'food' });
  },
};

export default productService;
