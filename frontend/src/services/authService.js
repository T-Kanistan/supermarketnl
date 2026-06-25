import api, { request } from './api';
import { normalizeRole } from '../constants/managerPermissions';

const TOKEN_KEY = 'supermarket_token';
const USER_KEY = 'supermarket_user';
const PERMISSIONS_KEY = 'supermarket_permissions';
const REMEMBER_KEY = 'supermarket_remember_me';

const isPersistedApiToken = (token) => {
  if (!token || typeof token !== 'string') return false;
  if (token.startsWith('mock_jwt_token_for_')) return false;
  return token.split('.').length === 3;
};

const decodeJwtPayload = (token) => {
  try {
    const payloadPart = token.split('.')[1];
    if (!payloadPart) return null;
    const normalized = payloadPart.replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(normalized));
  } catch {
    return null;
  }
};

const isTokenExpired = (token) => {
  const payload = decodeJwtPayload(token);
  if (!payload?.exp) return false;
  return payload.exp * 1000 <= Date.now();
};

const getUsableToken = () => {
  const token = readAuthToken();
  if (!token) return null;

  if (!isPersistedApiToken(token) || isTokenExpired(token)) {
    clearSession();
    return null;
  }

  return token;
};

const normalizeAuthUser = (user) => {
  if (!user) return null;
  return {
    ...user,
    role: normalizeRole(user.role) || user.role,
    displayRole: user.displayRole || user.role,
  };
};

const getActiveStorage = () => {
  if (localStorage.getItem(TOKEN_KEY)) return localStorage;
  if (sessionStorage.getItem(TOKEN_KEY)) return sessionStorage;
  return localStorage;
};

export const readAuthToken = () =>
  localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);

const clearStorage = (storage) => {
  storage.removeItem(TOKEN_KEY);
  storage.removeItem(USER_KEY);
  storage.removeItem(PERMISSIONS_KEY);
};

const persistSession = (token, user, permissions = [], rememberMe = true) => {
  const storage = rememberMe ? localStorage : sessionStorage;
  const other = rememberMe ? sessionStorage : localStorage;

  clearStorage(other);
  storage.setItem(TOKEN_KEY, token);
  storage.setItem(USER_KEY, JSON.stringify(user));
  storage.setItem(PERMISSIONS_KEY, JSON.stringify(permissions));
  localStorage.setItem(REMEMBER_KEY, rememberMe ? '1' : '0');
};

const clearSession = () => {
  clearStorage(localStorage);
  clearStorage(sessionStorage);
  localStorage.removeItem(REMEMBER_KEY);
};

export const authService = {
  login: async (login, password, rememberMe = true) => {
    clearSession();

    try {
      const response = await api.post('/auth/login', { email: login, password });
      const data = response.data;
      if (data?.token) {
        const normalizedUser = normalizeAuthUser(data.user);
        const role = normalizeRole(normalizedUser?.role);
        if (role !== 'admin' && role !== 'manager') {
          throw new Error('Access Denied. You are not authorized to access the dashboard.');
        }
        persistSession(data.token, normalizedUser, data.permissions || ['*'], rememberMe);
        return normalizedUser;
      }
      return normalizeAuthUser(data.user);
    } catch (error) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }

      if (
        !error.response ||
        error.code === 'ERR_NETWORK' ||
        error.response?.status >= 500
      ) {
        throw new Error('Unable to sign in. Please check your connection and try again.');
      }

      throw new Error('Invalid email or password');
    }
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      console.error('Logout request failed:', e);
    } finally {
      clearSession();
    }
  },

  getCurrentUser: async () => {
    const token = getUsableToken();
    if (!token) {
      return null;
    }

    try {
      const response = await api.get('/auth/me');
      const data = response.data;
      if (data?.user) {
        const normalizedUser = normalizeAuthUser(data.user);
        const storage = getActiveStorage();
        storage.setItem(USER_KEY, JSON.stringify(normalizedUser));
        if (data.user.permissions) {
          storage.setItem(PERMISSIONS_KEY, JSON.stringify(data.user.permissions));
        }
        return normalizedUser;
      }
      return null;
    } catch (error) {
      if (error.response?.status === 401) {
        clearSession();
        return null;
      }

      if (
        !error.response ||
        error.code === 'ERR_NETWORK' ||
        error.response?.status >= 500 ||
        error.response?.status === 404
      ) {
        const storage = getActiveStorage();
        const userJson = storage.getItem(USER_KEY);
        return userJson ? normalizeAuthUser(JSON.parse(userJson)) : null;
      }

      throw error;
    }
  },

  changePassword: async (currentPassword, newPassword, confirmPassword) => {
    try {
      const response = await api.post('/account/change-password', {
        currentPassword,
        newPassword,
        confirmPassword,
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to change password');
    }
  },

  forgotPassword: async (email) => {
    try {
      const response = await api.post('/auth/forgot-password', { email });
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message;
      const validationErrors = error.response?.data?.errors;
      if (validationErrors?.length) {
        throw new Error(validationErrors[0].message || validationErrors[0]);
      }
      if (message) {
        throw new Error(message);
      }
      if (!error.response || error.code === 'ERR_NETWORK' || error.response?.status >= 500) {
        throw new Error('Unable to send reset email. Please check your connection and try again.');
      }
      throw new Error('Unable to process password reset request');
    }
  },

  validateResetToken: async ({ email, token }) => {
    try {
      const response = await api.post('/auth/validate-reset-token', { email, token });
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message;
      if (message) {
        throw new Error(message);
      }
      throw new Error('Invalid or expired reset token');
    }
  },

  resetPassword: async ({ email, token, newPassword, confirmPassword }) => {
    try {
      const response = await api.post('/auth/reset-password', {
        email,
        token,
        newPassword,
        confirmPassword,
      });
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message;
      const validationErrors = error.response?.data?.errors;
      if (validationErrors?.length) {
        throw new Error(validationErrors[0].message || validationErrors[0]);
      }
      if (message) {
        throw new Error(message);
      }
      if (!error.response || error.code === 'ERR_NETWORK' || error.response?.status >= 500) {
        throw new Error('Unable to reset password. Please check your connection and try again.');
      }
      throw new Error('Invalid or expired reset token');
    }
  },
};

export default authService;
