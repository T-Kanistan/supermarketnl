import api, { apiRequest } from './api';
import {
  DUPLICATE_APPLICATION_CODE,
  DUPLICATE_APPLICATION_MESSAGE,
  DUPLICATE_APPLICATION_TITLE,
} from '../utils/jobApplicationDuplicate';

const buildDuplicateError = (data = {}) => {
  const error = new Error(data.message || DUPLICATE_APPLICATION_MESSAGE);
  error.code = data.code || DUPLICATE_APPLICATION_CODE;
  error.title = data.title || DUPLICATE_APPLICATION_TITLE;
  return error;
};

export const jobApplicationService = {
  checkDuplicateApplication: async (fields) => {
    const response = await api.post('/job-applications/check-duplicate', fields);
    return response.data?.duplicate === true;
  },

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

    try {
      const response = await api.post('/job-applications', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    } catch (error) {
      const data = error?.response?.data;
      if (data?.code === DUPLICATE_APPLICATION_CODE || error?.response?.status === 409) {
        throw buildDuplicateError(data);
      }
      throw error;
    }
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
