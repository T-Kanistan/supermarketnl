import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 5000,
});

// Inject JWT token into headers for all requests
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

// Response interceptor: automatically redirects to login on 401 Unauthorized
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

/**
 * Standard API call wrapper that automatically falls back to local database actions
 * when backend APIs are offline or return errors, allowing offline dashboard usage.
 * Includes a simulated delay to mimic real network conditions during development.
 */
export const request = async (apiPromise, fallbackFn) => {
  // Simulate 350ms delay for wow-factor loading skeletons
  await new Promise((resolve) => setTimeout(resolve, 350));
  
  try {
    const response = await apiPromise();
    return response.data;
  } catch (error) {
    // Check if network error (backend offline), specific non-responsive error, or 404 Not Found (module not implemented)
    if (!error.response || error.code === 'ERR_NETWORK' || error.response.status >= 500 || error.response.status === 404) {
      console.warn('Backend server offline, unreachable, or endpoint not implemented. Falling back to local storage db.', error.message);
      return fallbackFn();
    }
    throw error;
  }
};

/**
 * Resolves local upload image paths with backend origin.
 * Leaves absolute URLs (http/https) and base64 URLs as-is.
 */
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
