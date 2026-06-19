import api, { apiRequest } from './api';

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

  getContactMessages: async () => apiRequest(() => api.get('/cms/messages')),

  submitContactMessage: async (messageData) =>
    apiRequest(() => api.post('/enquiries', messageData)),

  markContactMessageRead: async (id, isRead) =>
    apiRequest(() => api.put(`/cms/messages/${id}/read`, { isRead })),

  deleteContactMessage: async (id) => apiRequest(() => api.delete(`/cms/messages/${id}`)),

  getAnnouncements: async () => apiRequest(() => api.get('/cms/announcements')),

  getAllAnnouncements: async () => apiRequest(() => api.get('/cms/announcements/all')),

  createAnnouncement: async (announcementData) => {
    const config = announcementData instanceof FormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : {};
    return apiRequest(() => api.post('/cms/announcements', announcementData, config));
  },

  updateAnnouncement: async (id, announcementData) => {
    const config = announcementData instanceof FormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : {};
    return apiRequest(() => api.put(`/cms/announcements/${id}`, announcementData, config));
  },

  deleteAnnouncement: async (id) => apiRequest(() => api.delete(`/cms/announcements/${id}`)),
};

export default cmsService;
