import api, { request } from './api';
import { localDb } from './localDb';

export const authService = {
  login: async (email, password) => {
    await new Promise((resolve) => setTimeout(resolve, 350));

    try {
      const response = await api.post('/auth/login', { email, password });
      const data = response.data;
      if (data?.token) {
        localStorage.setItem('supermarket_token', data.token);
        localStorage.setItem('supermarket_user', JSON.stringify(data.user));
      }
      return data.user;
    } catch (error) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }

      if (!error.response || error.code === 'ERR_NETWORK' || error.response.status >= 500 || error.response.status === 404) {
        const managers = localDb.getManagers();
        const user = managers.find((m) => m.email === email && m.password === password);
        if (!user) {
          throw new Error('Invalid email or password');
        }
        const token = 'mock_jwt_token_for_' + user.role;
        localStorage.setItem('supermarket_token', token);
        localStorage.setItem('supermarket_user', JSON.stringify(user));
        return user;
      }

      throw error;
    }
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      console.error('Logout request failed:', e);
    } finally {
      localStorage.removeItem('supermarket_token');
      localStorage.removeItem('supermarket_user');
    }
  },

  getCurrentUser: async () => {
    const token = localStorage.getItem('supermarket_token');
    if (!token) {
      return null;
    }

    await new Promise((resolve) => setTimeout(resolve, 350));

    try {
      const response = await api.get('/auth/me');
      const data = response.data;
      if (data?.user) {
        localStorage.setItem('supermarket_user', JSON.stringify(data.user));
      }
      return data.user ?? null;
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem('supermarket_token');
        localStorage.removeItem('supermarket_user');
        return null;
      }

      if (!error.response || error.code === 'ERR_NETWORK' || error.response.status >= 500 || error.response.status === 404) {
        const userJson = localStorage.getItem('supermarket_user');
        return userJson ? JSON.parse(userJson) : null;
      }

      throw error;
    }
  },

  changePassword: async (oldPassword, newPassword) => {
    return request(
      () => api.put('/auth/change-password', { oldPassword, newPassword }),
      () => {
        const userJson = localStorage.getItem('supermarket_user');
        if (!userJson) throw new Error('Not authenticated');
        const user = JSON.parse(userJson);
        
        const managers = localDb.getManagers();
        const index = managers.findIndex((m) => m.id === user.id);
        if (index === -1) throw new Error('User not found');
        
        if (managers[index].password !== oldPassword) {
          throw new Error('Incorrect old password');
        }

        managers[index].password = newPassword;
        localDb.saveManagers(managers);
        localStorage.setItem('supermarket_user', JSON.stringify(managers[index]));
        return { success: true, message: 'Password changed successfully' };
      }
    );
  },

  // Managers Management (Admin Only)
  getManagers: async () => {
    return request(
      async () => {
        const response = await api.get('/auth/managers');
        return { data: response.data.data };
      },
      () => localDb.getManagers().filter(m => m.role !== 'admin') // hide main admin from manager list
    );
  },

  createManager: async (managerData) => {
    return request(
      async () => {
        const response = await api.post('/auth/managers', managerData);
        return { data: response.data.data };
      },
      () => {
        const managers = localDb.getManagers();
        const existing = managers.find((m) => m.email === managerData.email);
        if (existing) throw new Error('Email already registered');
        
        const newManager = {
          id: Date.now().toString(),
          ...managerData,
          role: 'manager',
        };
        managers.push(newManager);
        localDb.saveManagers(managers);
        return newManager;
      }
    );
  },

  updateManager: async (id, managerData) => {
    return request(
      async () => {
        const response = await api.put(`/auth/managers/${id}`, managerData);
        return { data: response.data.data };
      },
      () => {
        const managers = localDb.getManagers();
        const idx = managers.findIndex((m) => m.id === id);
        if (idx === -1) throw new Error('Manager not found');
        
        managers[idx] = { ...managers[idx], ...managerData };
        localDb.saveManagers(managers);
        return managers[idx];
      }
    );
  },

  deleteManager: async (id) => {
    return request(
      () => api.delete(`/auth/managers/${id}`),
      () => {
        const managers = localDb.getManagers();
        const filtered = managers.filter((m) => m.id !== id);
        localDb.saveManagers(filtered);
        return { success: true };
      }
    );
  },

  resetManagerPassword: async (id, newPassword) => {
    return request(
      () => api.put(`/auth/managers/${id}/reset-password`, { password: newPassword }),
      () => {
        const managers = localDb.getManagers();
        const idx = managers.findIndex((m) => m.id === id);
        if (idx === -1) throw new Error('Manager not found');
        
        managers[idx].password = newPassword;
        localDb.saveManagers(managers);
        return { success: true, message: 'Password reset successful' };
      }
    );
  },
};

export default authService;
