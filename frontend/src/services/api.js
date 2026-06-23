import axios from 'axios';

const DEFAULT_API_ORIGIN = 'http://localhost:5000';

const normalizeApiOrigin = (value) => {
  const rawValue = value || DEFAULT_API_ORIGIN;
  return rawValue.replace(/\/+$/, '').replace(/\/api$/, '');
};

export const API_ORIGIN = normalizeApiOrigin(import.meta.env.VITE_API_URL);
export const API_BASE_URL = `${API_ORIGIN}/api`;

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('supermarket_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

const addIdField = (val) => {
  if (Array.isArray(val)) {
    val.forEach(addIdField);
  } else if (val && typeof val === 'object') {
    if (val._id && !val.id) {
      val.id = val._id;
    }
    Object.values(val).forEach(addIdField);
  }
};

api.interceptors.response.use(
  (response) => {
    if (response.data) {
      addIdField(response.data);
    }
    return response;
  },
  (error) => {
    const requestUrl = error.config?.url || '';
    const isAuthCheck =
      requestUrl.includes('/auth/me') ||
      requestUrl.includes('/auth/login') ||
      requestUrl.includes('/auth/manager-login');

    if (error.response?.status === 401 && !isAuthCheck) {
      localStorage.removeItem('supermarket_token');
      localStorage.removeItem('supermarket_user');
      if (window.location.pathname.startsWith('/admin') && !window.location.pathname.startsWith('/admin/login')) {
        window.location.href = '/admin/login';
      }
    }
    return Promise.reject(error);
  }
);

const unwrapResult = (result) => {
  if (result == null) return result;

  if (typeof result === 'object' && typeof result.status === 'number' && result.data !== undefined && result.headers) {
    return unwrapResult(result.data);
  }

  if (typeof result === 'object' && result.success === true && 'data' in result) {
    return result.data;
  }

  if (typeof result === 'object' && !Array.isArray(result) && Object.keys(result).length === 1 && 'data' in result) {
    return result.data;
  }

  return result;
};

/** CMS API calls - no localStorage fallback */
export const apiRequest = async (apiPromise) => {
  const result = await apiPromise();
  return unwrapResult(result);
};

/** Legacy wrapper - optional fallback for non-CMS modules only */
export const request = async (apiPromise, fallbackFn) => {
  try {
    const result = await apiPromise();
    return unwrapResult(result);
  } catch (error) {
    if (fallbackFn && (!error.response || error.code === 'ERR_NETWORK' || error.response.status >= 500)) {
      console.warn('API unavailable, using fallback.', error.message);
      return fallbackFn();
    }
    throw error;
  }
};

export const getImageUrl = (imagePath) => {
  if (!imagePath) return '';
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://') || imagePath.startsWith('data:')) {
    return imagePath;
  }
  if (imagePath.startsWith('/uploads') || imagePath.startsWith('/images')) {
    if (imagePath.startsWith('/images')) {
      return imagePath;
    }
    return `${API_ORIGIN}${imagePath}`;
  }
  return imagePath;
};

export default api;
