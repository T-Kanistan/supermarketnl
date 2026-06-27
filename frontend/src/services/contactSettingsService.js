import api, { apiRequest } from './api';
import { extractMapEmbedUrl } from '../utils/mapEmbed';

const mapSocials = (data) => ({
  facebook: data.facebookUrl || '',
  instagram: data.instagramUrl || '',
  whatsapp: data.whatsappUrl || '',
  tiktok: data.tiktokUrl || '',
  youtube: data.youtubeUrl || '',
});

const mapApiToForm = (data) => ({
  contactPhone: data.phoneNumber,
  contactEmail: data.emailAddress,
  storeName: data.storeName,
  address: data.storeAddress,
  supermarketTimings: data.supermarketOpeningHours,
  foodCornerTimings: data.foodCornerOpeningHours,
  socials: mapSocials(data),
  contactPage: {
    phoneSubtext: data.phoneSubtext,
    emailNote: data.emailSubtext,
    holidayHours: data.holidayNote,
    heroBadge: data.heroBadge,
    heroTitle: data.heroTitle,
    heroSubtitle: data.heroSubtitle,
    heroFeature1: data.heroFeature1,
    heroFeature2: data.heroFeature2,
    heroFeature3: data.heroFeature3,
    infoCardTitle: data.infoCardTitle,
    infoCardSubtitle: data.infoCardSubtitle,
    formTitle: data.formTitle,
    formSubtitle: data.formSubtitle,
    submitButtonText: data.submitButtonText,
    nameLabel: data.fullNameLabel,
    namePlaceholder: data.fullNamePlaceholder,
    emailLabel: data.emailLabel,
    emailPlaceholder: data.emailPlaceholder,
    phoneLabel: data.phoneLabel,
    phonePlaceholder: data.phonePlaceholder,
    subjectLabel: data.subjectLabel,
    subjectPlaceholder: data.subjectPlaceholder,
    messageLabel: data.messageLabel,
    messagePlaceholder: data.messagePlaceholder,
    privacyNote: data.privacyNote,
    helpBoxText: data.helpBoxTitle,
    helpBoxSubtext: data.helpBoxSubtitle,
    mapEmbedUrl: extractMapEmbedUrl(data.googleMapsEmbedUrl),
  },
});

const mapFormToApi = (formData) => {
  const cp = formData.contactPage || {};
  return {
    phoneNumber: formData.contactPhone,
    phoneSubtext: cp.phoneSubtext || '',
    emailAddress: formData.contactEmail,
    emailSubtext: cp.emailNote,
    storeName: formData.storeName,
    storeAddress: formData.address,
    supermarketOpeningHours: formData.supermarketTimings,
    foodCornerOpeningHours: formData.foodCornerTimings,
    holidayNote: cp.holidayHours,
    heroBadge: cp.heroBadge,
    heroTitle: cp.heroTitle,
    heroSubtitle: cp.heroSubtitle,
    heroFeature1: cp.heroFeature1,
    heroFeature2: cp.heroFeature2,
    heroFeature3: cp.heroFeature3,
    infoCardTitle: cp.infoCardTitle,
    infoCardSubtitle: cp.infoCardSubtitle,
    formTitle: cp.formTitle,
    formSubtitle: cp.formSubtitle,
    submitButtonText: cp.submitButtonText,
    fullNameLabel: cp.nameLabel,
    fullNamePlaceholder: cp.namePlaceholder,
    emailLabel: cp.emailLabel,
    emailPlaceholder: cp.emailPlaceholder,
    phoneLabel: cp.phoneLabel,
    phonePlaceholder: cp.phonePlaceholder,
    subjectLabel: cp.subjectLabel,
    subjectPlaceholder: cp.subjectPlaceholder,
    messageLabel: cp.messageLabel,
    messagePlaceholder: cp.messagePlaceholder,
    privacyNote: cp.privacyNote,
    helpBoxTitle: cp.helpBoxText,
    helpBoxSubtitle: cp.helpBoxSubtext,
    googleMapsEmbedUrl: extractMapEmbedUrl(cp.mapEmbedUrl),
  };
};

export const contactSettingsService = {
  getContactSettings: async () => {
    const data = await apiRequest(() => api.get('/contact-settings'));
    return mapApiToForm(data);
  },

  updateContactSettings: async (formData) => {
    const payload = mapFormToApi(formData);
    const data = await apiRequest(() => api.put('/contact-settings', payload));
    return mapApiToForm(data);
  },
};

export default contactSettingsService;
