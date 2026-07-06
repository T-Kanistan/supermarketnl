import api, { apiRequest } from './api';
import { mapSocialLinksToSocials } from '../constants/footerPageDefaults';

const mapLinkToPage = (link) => ({
  id: String(link.id),
  label: link.label,
  path: link.url,
  enabled: link.isVisible !== false,
  order: link.displayOrder,
});

const mapSocialLinkToPage = (link, index) => ({
  id: String(link.id || `sm-${index + 1}`),
  platform: link.platform || 'facebook',
  url: link.url || '',
  enabled: link.isVisible !== false,
  order: link.displayOrder,
});

export const mapFooterApiToFrontend = (data) => {
  const s = data.settings || {};
  const socialLinks = (data.socialMediaLinks || []).map(mapSocialLinkToPage);
  const socials = socialLinks.length
    ? mapSocialLinksToSocials(socialLinks)
    : {
        facebook: s.facebookUrl || '',
        instagram: s.instagramUrl || '',
        whatsapp: s.whatsappUrl || '',
        tiktok: s.tiktokUrl || '',
        youtube: s.youtubeUrl || '',
      };

  return {
    logo: s.footerLogo || '/logo.png',
    footerDescription: s.footerDescription || '',
    contactPhone: s.phoneNumber || '',
    contactEmail: s.emailAddress || '',
    address: s.address || '',
    supermarketTimings: s.supermarketHours || '',
    foodCornerTimings: s.foodCornerHours || '',
    socials,
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
      legalLinks: (data.legalLinks || []).map(mapLinkToPage),
      socialLinks,
    },
  };
};

const mapPageLinkToApi = (link, index) => ({
  label: link.label,
  url: link.path || '/',
  displayOrder: link.order ?? index + 1,
  isVisible: link.enabled !== false,
});

const mapSocialLinkToApi = (link, index) => ({
  platform: link.platform,
  url: link.url || '',
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
        legalLinks: (footer.legalLinks || []).map(mapPageLinkToApi),
        socialMediaLinks: (footer.socialLinks || []).map(mapSocialLinkToApi),
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
