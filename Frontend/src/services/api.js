import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
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
    const isAuthCheck = requestUrl.includes('/auth/me') || requestUrl.includes('/auth/login');

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

/** CMS API calls — no localStorage fallback */
export const apiRequest = async (apiPromise) => {
  const result = await apiPromise();
  return unwrapResult(result);
};

/** Legacy wrapper — optional fallback for non-CMS modules only */
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
  if (imagePath.startsWith('/uploads')) {
    const backendUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace('/api', '');
    return `${backendUrl}${imagePath}`;
  }
  return imagePath;
};

export default api;
