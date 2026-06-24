import api, { apiRequest } from './api';

export const jobApplicationService = {
  submitApplication: async ({ fields, cvFile }) => {
    const formData = new FormData();
    Object.entries(fields).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, value);
      }
    });
    if (cvFile) {
      formData.append('cv', cvFile);
    }

    const response = await api.post('/job-applications', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  getApplications: async (params = {}) => {
    const response = await api.get('/admin/job-applications', { params });
    return response.data?.data ?? [];
  },

  updateStatus: async (id, status) => {
    const response = await api.patch(`/admin/job-applications/${id}/status`, { status });
    return response.data?.data;
  },

  deleteApplication: async (id) => apiRequest(() => api.delete(`/admin/job-applications/${id}`)),
};

export default jobApplicationService;
