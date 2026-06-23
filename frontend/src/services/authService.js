import api, { request } from './api';
import { localDb } from './localDb';
import { normalizeRole } from '../constants/managerPermissions';

const normalizeAuthUser = (user) => {
  if (!user) return null;
  return {
    ...user,
    role: normalizeRole(user.role) || user.role,
    displayRole: user.displayRole || user.role,
  };
};

const persistSession = (token, user, permissions = []) => {
  localStorage.setItem('supermarket_token', token);
  localStorage.setItem('supermarket_user', JSON.stringify(user));
  localStorage.setItem('supermarket_permissions', JSON.stringify(permissions));
};

const clearSession = () => {
  localStorage.removeItem('supermarket_token');
  localStorage.removeItem('supermarket_user');
  localStorage.removeItem('supermarket_permissions');
};

export const authService = {
  login: async (login, password) => {
    await new Promise((resolve) => setTimeout(resolve, 200));

    try {
      const response = await api.post('/auth/login', { email: login, password });
      const data = response.data;
      if (data?.token) {
        const normalizedUser = normalizeAuthUser(data.user);
        persistSession(data.token, normalizedUser, data.permissions || ['*']);
        return normalizedUser;
      }
      return normalizeAuthUser(data.user);
    } catch (adminError) {
      if (adminError.response?.status === 401) {
        try {
          const mgrResponse = await api.post('/auth/manager-login', { login, password });
          const data = mgrResponse.data;
          if (data?.token) {
            const normalizedUser = normalizeAuthUser(data.user);
            persistSession(data.token, normalizedUser, data.permissions || []);
            return normalizedUser;
          }
          return normalizeAuthUser(data.user);
        } catch (managerError) {
          if (managerError.response?.data?.message) {
            throw new Error(managerError.response.data.message);
          }
          throw managerError;
        }
      }

      if (adminError.response?.data?.message) {
        throw new Error(adminError.response.data.message);
      }

      if (
        !adminError.response ||
        adminError.code === 'ERR_NETWORK' ||
        adminError.response.status >= 500 ||
        adminError.response.status === 404
      ) {
        const managers = localDb.getManagers();
        const user = managers.find(
          (m) => (m.email === login || m.username === login) && m.password === password
        );
        if (!user) {
          throw new Error('Invalid email or password');
        }
        const token = `mock_jwt_token_for_${user.role}`;
        persistSession(token, user, user.role === 'admin' ? ['*'] : ['products', 'offers', 'enquiries', 'content']);
        return normalizeAuthUser(user);
      }

      throw adminError;
    }
  },

  logout: async () => {
    const userJson = localStorage.getItem('supermarket_user');
    const user = userJson ? JSON.parse(userJson) : null;

    try {
      if (normalizeRole(user?.role) === 'manager') {
        await api.post('/auth/manager-logout');
      } else {
        await api.post('/auth/logout');
      }
    } catch (e) {
      console.error('Logout request failed:', e);
    } finally {
      clearSession();
    }
  },

  getCurrentUser: async () => {
    const token = localStorage.getItem('supermarket_token');
    if (!token) {
      return null;
    }

    try {
      const response = await api.get('/auth/me');
      const data = response.data;
      if (data?.user) {
        const normalizedUser = normalizeAuthUser(data.user);
        localStorage.setItem('supermarket_user', JSON.stringify(normalizedUser));
        if (data.user.permissions) {
          localStorage.setItem('supermarket_permissions', JSON.stringify(data.user.permissions));
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
        error.response.status >= 500 ||
        error.response.status === 404
      ) {
        const userJson = localStorage.getItem('supermarket_user');
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
};

export default authService;
