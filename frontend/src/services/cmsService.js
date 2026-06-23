import api, { apiRequest } from './api';
import enquiryService from './enquiryService';

export const mapHomeResponse = (home) => ({
  storeName: home.storeName,
  logo: home.logo,
  supermarketTimings: home.supermarketTimings,
  foodCornerTimings: home.foodCornerTimings,
  featuresSection: home.featuresSection || { items: [] },
  aboutSection: home.aboutSection || { bulletPoints: [], image: '', buttonText: 'Learn More' },
  foodCornerPromo: home.foodCornerPromo || {},
});

export const cmsService = {
  getHomeSettings: async () => {
    const home = await apiRequest(() => api.get('/cms/settings'));
    return mapHomeResponse(home);
  },

  updateHomeSettings: async (settingsData) => {
    let payload;
    if (settingsData instanceof FormData) {
      payload = settingsData;
    } else {
      payload = { ...settingsData };
    }
    const config = payload instanceof FormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : {};
    const home = await apiRequest(() => api.put('/cms/settings', payload, config));
    return mapHomeResponse(home);
  },

  getContactMessages: async (params = {}) => {
    const { data } = await enquiryService.getEnquiries(params);
    return data;
  },

  submitContactMessage: async (messageData) =>
    enquiryService.submitContactEnquiry({
      name: messageData.name,
      email: messageData.email,
      phone: messageData.phone,
      subject: messageData.subject,
      message: messageData.message,
    }),

  markContactMessageRead: async (id) => enquiryService.markAsRead(id),

  deleteContactMessage: async (id) => enquiryService.deleteEnquiry(id),

  getAnnouncements: async () => apiRequest(() => api.get('/storefront/announcements')),

  getAllAnnouncements: async (params = {}) => {
    const result = await api.get('/announcements', { params });
    const body = result.data;
    if (body?.success && Array.isArray(body.data)) {
      return body.data;
    }
    return body?.data ?? body ?? [];
  },

  createAnnouncement: async (announcementData) => {
    const payload = {
      title: announcementData.title,
      description: announcementData.description,
      discountPercentage: Number(announcementData.discountPercentage ?? announcementData.offerPercentage ?? 0),
      bannerImage: announcementData.bannerImage || announcementData.image || '',
      status: announcementData.status || 'active',
      startDate: announcementData.startDate,
      endDate: announcementData.endDate,
    };
    return apiRequest(() => api.post('/announcements', payload));
  },

  updateAnnouncement: async (id, announcementData) => {
    const payload = {
      title: announcementData.title,
      description: announcementData.description,
      discountPercentage: Number(announcementData.discountPercentage ?? announcementData.offerPercentage ?? 0),
      bannerImage: announcementData.bannerImage || announcementData.image || '',
      status: announcementData.status || 'active',
      startDate: announcementData.startDate,
      endDate: announcementData.endDate,
    };
    return apiRequest(() => api.put(`/announcements/${id}`, payload));
  },

  deleteAnnouncement: async (id) => apiRequest(() => api.delete(`/announcements/${id}`)),
};

export default cmsService;
