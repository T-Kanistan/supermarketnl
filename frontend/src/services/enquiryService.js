import api, { apiRequest } from './api';

export const enquiryService = {
  submitContactEnquiry: async (payload) =>
    apiRequest(() => api.post('/enquiries/contact', {
      senderName: payload.senderName || payload.fullName || payload.name,
      email: payload.email,
      phone: payload.phone || payload.phoneNumber,
      subject: payload.subject || payload.enquiryType,
      message: payload.message,
    })),

  submitGeneralEnquiry: async (payload) =>
    apiRequest(() => api.post('/enquiries/contact', {
      senderName: payload.fullName || payload.senderName || payload.name,
      email: payload.email,
      phone: payload.phoneNumber || payload.phone,
      subject: payload.enquiryType,
      message: payload.message,
      source: payload.source || 'website',
    })),

  submitProductEnquiry: async (payload) =>
    apiRequest(() => api.post('/enquiries/product', {
      senderName: payload.senderName || payload.fullName || payload.name,
      email: payload.email,
      phone: payload.phone,
      productName: payload.productName,
      quantityRequired: payload.quantityRequired || payload.quantity,
      message: payload.message,
    })),

  submitFoodCornerEnquiry: async (payload) =>
    apiRequest(() => api.post('/enquiries/food-corner', {
      senderName: payload.senderName || payload.fullName || payload.name,
      email: payload.email,
      phone: payload.phone,
      productName: payload.productName,
      message: payload.message,
    })),

  getEnquiries: async (params = {}) => {
    const result = await apiRequest(() => api.get('/admin/enquiries', { params }));
    const data = Array.isArray(result) ? result : Array.isArray(result?.data) ? result.data : [];
    return {
      data,
      pagination: result?.pagination || null,
    };
  },

  getEnquiryById: async (id) => apiRequest(() => api.get(`/admin/enquiries/${id}`)),

  getStats: async () => apiRequest(() => api.get('/admin/enquiries/stats')),

  updateStatus: async (id, status) =>
    apiRequest(() => api.patch(`/admin/enquiries/${id}/status`, { status })),

  markAsRead: async (id) => apiRequest(() => api.put(`/admin/enquiries/${id}/read`)),

  closeEnquiry: async (id) => apiRequest(() => api.put(`/admin/enquiries/${id}/close`)),

  deleteEnquiry: async (id) => apiRequest(() => api.delete(`/admin/enquiries/${id}`)),
};

export default enquiryService;
