import api, { apiRequest } from './api';

export const adminVacancyService = {
  getStats: async () => apiRequest(() => api.get('/admin/vacancies/stats')),

  getVacancies: async (params = {}) =>
    apiRequest(() => api.get('/admin/vacancies', { params })),

  getVacancy: async (id) => apiRequest(() => api.get(`/admin/vacancies/${id}`)),

  createVacancy: async (payload) =>
    apiRequest(() => api.post('/admin/vacancies', payload)),

  updateVacancy: async (id, payload) =>
    apiRequest(() => api.put(`/admin/vacancies/${id}`, payload)),

  updateStatus: async (id, status) =>
    apiRequest(() => api.patch(`/admin/vacancies/${id}/status`, { status })),

  extendVacancy: async (id, closingDate) =>
    apiRequest(() => api.patch(`/admin/vacancies/${id}/extend`, { closingDate })),

  deleteVacancy: async (id) => apiRequest(() => api.delete(`/admin/vacancies/${id}`)),
};

export default adminVacancyService;
