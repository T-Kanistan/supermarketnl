import api, { apiRequest } from './api';

const mapLinkToPage = (link) => ({
  id: String(link.id),
  label: link.label,
  path: link.url,
  enabled: link.isVisible !== false,
  order: link.displayOrder,
});

export const mapFooterApiToFrontend = (data) => {
  const s = data.settings || {};
  return {
    logo: s.footerLogo || '/logo.png',
    footerDescription: s.footerDescription || '',
    contactPhone: s.phoneNumber || '',
    contactEmail: s.emailAddress || '',
    address: s.address || '',
    supermarketTimings: s.supermarketHours || '',
    foodCornerTimings: s.foodCornerHours || '',
    socials: {
      facebook: s.facebookUrl || '',
      instagram: s.instagramUrl || '',
      whatsapp: s.whatsappUrl || '',
      tiktok: s.tiktokUrl || '',
      youtube: s.youtubeUrl || '',
    },
    footerPage: {
      quickLinksTitle: 'QUICK LINKS',
      categoriesTitle: 'CATEGORIES',
      businessHoursTitle: s.businessHoursTitle || 'BUSINESS HOURS',
      contactTitle: s.contactTitle || 'CONTACT',
      supermarketLabel: s.supermarketLabel || 'Supermarket',
      foodCornerLabel: s.foodCornerLabel || 'Food Corner',
      sundayHours: s.specialHoursNote || '',
      copyrightText: s.copyrightName || '',
      quickLinks: (data.quickLinks || []).map(mapLinkToPage),
      categoryLinks: (data.categoryLinks || []).map(mapLinkToPage),
      legalLinks: (data.legalLinks || []).map(mapLinkToPage),
    },
  };
};

const mapPageLinkToApi = (link, index) => ({
  label: link.label,
  url: link.path || '/',
  displayOrder: link.order ?? index + 1,
  isVisible: link.enabled !== false,
});

export const footerService = {
  getFooterSettings: async () => {
    const data = await apiRequest(() => api.get('/footer/settings?full=true'));
    return mapFooterApiToFrontend(data);
  },

  updateFooterSettings: async (payload) => {
    const data = await apiRequest(() => api.put('/footer/settings', payload));
    return data;
  },

  saveFooterFromAdmin: async (formData) => {
    const footer = formData.footerPage || {};
    await apiRequest(() =>
      api.put('/footer/settings', {
        footerDescription: formData.footerDescription,
        footerLogo: formData.logo,
        facebookUrl: formData.socials?.facebook,
        instagramUrl: formData.socials?.instagram,
        whatsappUrl: formData.socials?.whatsapp,
        tiktokUrl: formData.socials?.tiktok,
        youtubeUrl: formData.socials?.youtube,
        businessHoursTitle: footer.businessHoursTitle,
        supermarketLabel: footer.supermarketLabel,
        supermarketHours: formData.supermarketTimings,
        foodCornerLabel: footer.foodCornerLabel,
        foodCornerHours: formData.foodCornerTimings,
        specialHoursNote: footer.sundayHours,
        contactTitle: footer.contactTitle,
        address: formData.address,
        phoneNumber: formData.contactPhone,
        emailAddress: formData.contactEmail,
        copyrightName: footer.copyrightText,
        quickLinks: (footer.quickLinks || []).map(mapPageLinkToApi),
        categoryLinks: (footer.categoryLinks || []).map(mapPageLinkToApi),
        legalLinks: (footer.legalLinks || []).map(mapPageLinkToApi),
      })
    );
    return footerService.getFooterSettings();
  },

  uploadLogo: async (file) => {
    const formData = new FormData();
    formData.append('footer_logo', file);
    return apiRequest(() =>
      api.post('/footer/upload-logo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    );
  },
};

export default footerService;
