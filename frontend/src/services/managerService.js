import api, { request } from './api';

export const managerService = {
  getManagers: async (params = {}) => {
    return request(async () => {
      const response = await api.get('/managers', { params });
      return response.data?.data ?? response.data;
    });
  },

  getManager: async (id) => {
    return request(async () => {
      const response = await api.get(`/managers/${id}`);
      return response.data?.data ?? response.data;
    });
  },

  createManager: async (managerData) => {
    return request(async () => {
      const response = await api.post('/managers', managerData);
      return response.data?.data ?? response.data;
    });
  },

  updateManager: async (id, managerData) => {
    return request(async () => {
      const response = await api.put(`/managers/${id}`, managerData);
      return response.data?.data ?? response.data;
    });
  },

  deleteManager: async (id) => {
    return request(async () => {
      const response = await api.delete(`/managers/${id}`);
      return response.data;
    });
  },

  toggleManagerStatus: async (id, status) => {
    return request(async () => {
      const response = await api.patch(`/managers/${id}/status`, { status });
      return response.data?.data ?? response.data;
    });
  },
};

export default managerService;
