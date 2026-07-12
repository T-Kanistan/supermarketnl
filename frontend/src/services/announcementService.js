import api, { apiRequest } from './api';

const toPayload = (data) => ({
  title: data.title,
  subtitle: data.subtitle || '',
  description: data.description,
  badgeText: data.badgeText || '',
  buttonText: data.buttonText || 'Shop Offers',
  buttonLink: data.buttonLink || '/offers',
  overlayColor: data.overlayColor || '#0f172a',
  overlayOpacity: data.overlayOpacity != null && data.overlayOpacity !== ''
    ? Number(data.overlayOpacity)
    : 0.35,
  discountPercentage: Number(data.discountPercentage ?? data.offerPercentage ?? 0),
  bannerImage: data.bannerImage || data.image || '',
  status: data.status || 'draft',
  startDate: data.startDate,
  endDate: data.endDate,
});

export const announcementService = {
  /** Homepage announcement banners only — active + within date range. */
  getActiveAnnouncements: async () =>
    apiRequest(() => api.get('/store-announcements/active', { params: { _t: Date.now() } })),

  /** @deprecated Use getActiveAnnouncements — kept for callers still on the storefront alias. */
  getStorefrontAnnouncements: async () =>
    apiRequest(() => api.get('/store-announcements/active', { params: { _t: Date.now() } })),

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
