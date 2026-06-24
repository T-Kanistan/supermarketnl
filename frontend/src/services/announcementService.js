import api, { apiRequest } from './api';

const toPayload = (data) => ({
  title: data.title,
  description: data.description,
  discountPercentage: Number(data.discountPercentage ?? data.offerPercentage ?? 0),
  bannerImage: data.bannerImage || data.image || '',
  status: data.status || 'draft',
  startDate: data.startDate,
  endDate: data.endDate,
});

export const announcementService = {
  getStorefrontAnnouncements: async () =>
    apiRequest(() => api.get('/storefront/announcements')),

  getAnnouncements: async (params = {}) => {
    const result = await api.get('/announcements', { params });
    const body = result.data;
    if (body?.success && Array.isArray(body.data)) {
      return {
        data: body.data,
        pagination: body.pagination || null,
      };
    }
    return { data: body?.data ?? body ?? [], pagination: null };
  },

  searchAnnouncements: async (query) => {
    const result = await api.get('/announcements/search', { params: { q: query } });
    const body = result.data;
    return {
      data: body?.data ?? [],
      pagination: body?.pagination || null,
    };
  },

  getAnnouncementById: async (id) => apiRequest(() => api.get(`/announcements/${id}`)),

  uploadBanner: async (file) => {
    const formData = new FormData();
    formData.append('image', file);
    const response = await api.post('/upload/announcement-banner', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data.imageUrl;
  },

  createAnnouncement: async (announcementData) => {
    const payload = toPayload(announcementData);
    return apiRequest(() => api.post('/announcements', payload));
  },

  updateAnnouncement: async (id, announcementData) => {
    const payload = toPayload(announcementData);
    return apiRequest(() => api.put(`/announcements/${id}`, payload));
  },

  deleteAnnouncement: async (id) => apiRequest(() => api.delete(`/announcements/${id}`)),
};

export default announcementService;
