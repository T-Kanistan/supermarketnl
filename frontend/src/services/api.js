import axios from 'axios';

// Resolve the API location:
// - If VITE_API_URL is set (e.g. a separate backend host), use it as an
//   absolute origin: requests go to `${origin}/api`.
// - If it is NOT set, use a same-origin relative base (`/api`). This works with
//   the Vite dev/preview proxy locally, and with a reverse-proxy/rewrite in
//   production — and never accidentally points at `localhost` in a deployed build.
const normalizeApiOrigin = (value) =>
  String(value || '').trim().replace(/\/+$/, '').replace(/\/api$/, '');

export const API_ORIGIN = normalizeApiOrigin(import.meta.env.VITE_API_URL);
export const API_BASE_URL = API_ORIGIN ? `${API_ORIGIN}/api` : '/api';

const readAuthToken = () =>
  localStorage.getItem('supermarket_token') || sessionStorage.getItem('supermarket_token');

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

api.interceptors.request.use(
  (config) => {
    const token = readAuthToken();
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
      localStorage.removeItem('supermarket_permissions');
      sessionStorage.removeItem('supermarket_token');
      sessionStorage.removeItem('supermarket_user');
      sessionStorage.removeItem('supermarket_permissions');

      const path = window.location.pathname;
      const isProtectedDashboard =
        path.startsWith('/admin/dashboard') || path.startsWith('/manager/dashboard');

      if (isProtectedDashboard) {
        window.location.href = '/login?expired=1';
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
    const isLocalhost = typeof window !== 'undefined' && 
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

    if (API_ORIGIN) {
      if (API_ORIGIN.includes('localhost') || API_ORIGIN.includes('127.0.0.1')) {
        return isLocalhost ? `${API_ORIGIN}${imagePath}` : imagePath;
      }
      return `${API_ORIGIN}${imagePath}`;
    }
    return imagePath;
  }
  return imagePath;
};

export default api;
