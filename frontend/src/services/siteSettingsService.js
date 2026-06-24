import api, { apiRequest } from './api';

const mapApiToForm = (data) => ({
  storeName: data.storeName || '',
  storeLogo: data.storeLogo || '',
  physicalAddress: data.physicalAddress || '',
  supermarketOpeningHours: data.supermarketOpeningHours || '',
  foodCornerOpeningHours: data.foodCornerOpeningHours || '',
});

export const siteSettingsService = {
  getSiteSettings: async () => {
    const data = await apiRequest(() => api.get('/settings'));
    return mapApiToForm(data);
  },

  updateSiteSettings: async (formData) => {
    const payload = {
      storeName: formData.storeName,
      storeLogo: formData.logo,
      physicalAddress: formData.address,
      supermarketOpeningHours: formData.supermarketTimings,
      foodCornerOpeningHours: formData.foodCornerTimings,
    };

    const data = await apiRequest(() => api.put('/settings', payload));
    return mapApiToForm(data);
  },
};

export default siteSettingsService;
