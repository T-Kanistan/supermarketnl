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

// Response interceptor: automatically redirects to login on 401 Unauthorized
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('supermarket_token');
      localStorage.removeItem('supermarket_user');
      // Redirect to admin login if attempting to access a protected admin page and not already there
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

export default api;
