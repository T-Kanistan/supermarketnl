import api, { request } from './api';
import { localDb } from './localDb';

export const cmsService = {
  getSiteSettings: async () => {
    return request(
      async () => {
        const response = await api.get('/cms/settings');
        const data = response.data;
        const cms = data.data || data;
        const mapped = {
          storeName: cms.storeName,
          logo: cms.logo,
          contactEmail: cms.contactEmail,
          contactPhone: cms.contactPhone,
          address: cms.address,
          aboutUs: cms.aboutUs,
          footerDescription: cms.footerDescription,
          supermarketTimings: cms.supermarketTimings,
          foodCornerTimings: cms.foodCornerTimings,
          socials: {
            facebook: cms.facebook || '#',
            instagram: cms.instagram || '#',
            whatsapp: cms.whatsapp || '#',
            youtube: cms.youtube || '#',
            tiktok: cms.tiktok || '#',
          }
        };
        return { data: mapped };
      },
      () => localDb.getSettings()
    );
  },

  updateSiteSettings: async (settingsData) => {
    return request(
      async () => {
        // Flatten payload for backend if it is a JSON object
        let payload;
        if (settingsData instanceof FormData) {
          payload = settingsData;
        } else {
          payload = { ...settingsData };
          if (settingsData.socials) {
            payload.facebook = settingsData.socials.facebook;
            payload.instagram = settingsData.socials.instagram;
            payload.whatsapp = settingsData.socials.whatsapp;
            payload.youtube = settingsData.socials.youtube;
            payload.tiktok = settingsData.socials.tiktok;
            delete payload.socials;
          }
        }

        const config = payload instanceof FormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : {};
        const response = await api.put('/cms/settings', payload, config);
        const data = response.data;
        const cms = data.data || data;
        const mapped = {
          storeName: cms.storeName,
          logo: cms.logo,
          contactEmail: cms.contactEmail,
          contactPhone: cms.contactPhone,
          address: cms.address,
          aboutUs: cms.aboutUs,
          footerDescription: cms.footerDescription,
          supermarketTimings: cms.supermarketTimings,
          foodCornerTimings: cms.foodCornerTimings,
          socials: {
            facebook: cms.facebook || '#',
            instagram: cms.instagram || '#',
            whatsapp: cms.whatsapp || '#',
            youtube: cms.youtube || '#',
            tiktok: cms.tiktok || '#',
          }
        };
        return { data: mapped };
      },
      () => localDb.saveSettings(settingsData)
    );
  },

  // Contact Messages
  getContactMessages: async () => {
    return request(
      () => api.get('/cms/messages'),
      () => localDb.getMessages()
    );
  },

  submitContactMessage: async (messageData) => {
    return request(
      () => api.post('/cms/messages', messageData),
      () => {
        const messages = localDb.getMessages();
        const newMessage = {
          id: Date.now().toString(),
          ...messageData,
          date: new Date().toISOString(),
        };
        messages.push(newMessage);
        localDb.saveMessages(messages);
        return newMessage;
      }
    );
  },

  deleteContactMessage: async (id) => {
    return request(
      () => api.delete(`/cms/messages/${id}`),
      () => {
        const messages = localDb.getMessages();
        const filtered = messages.filter((m) => m.id !== id);
        localDb.saveMessages(filtered);
        return { success: true };
      }
    );
  },

  // Announcements / Offers
  getAnnouncements: async () => {
    return request(
      async () => {
        const response = await api.get('/cms/announcements');
        const data = response.data;
        return { data: data.data || data };
      },
      () => localDb.getAnnouncements()
    );
  },

  createAnnouncement: async (announcementData) => {
    return request(
      async () => {
        const config = announcementData instanceof FormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : {};
        const response = await api.post('/cms/announcements', announcementData, config);
        const data = response.data;
        return { data: data.data || data };
      },
      () => {
        const announcements = localDb.getAnnouncements();
        const newAnn = {
          id: Date.now().toString(),
          ...announcementData,
        };
        announcements.push(newAnn);
        localDb.saveAnnouncements(announcements);
        return newAnn;
      }
    );
  },

  updateAnnouncement: async (id, announcementData) => {
    return request(
      async () => {
        const config = announcementData instanceof FormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : {};
        const response = await api.put(`/cms/announcements/${id}`, announcementData, config);
        const data = response.data;
        return { data: data.data || data };
      },
      () => {
        const announcements = localDb.getAnnouncements();
        const idx = announcements.findIndex((a) => a.id === id);
        if (idx === -1) throw new Error('Announcement not found');
        
        announcements[idx] = { ...announcements[idx], ...announcementData };
        localDb.saveAnnouncements(announcements);
        return announcements[idx];
      }
    );
  },

  deleteAnnouncement: async (id) => {
    return request(
      () => api.delete(`/cms/announcements/${id}`),
      () => {
        const announcements = localDb.getAnnouncements();
        const filtered = announcements.filter((a) => a.id !== id);
        localDb.saveAnnouncements(filtered);
        return { success: true };
      }
    );
  },
};

export default cmsService;
