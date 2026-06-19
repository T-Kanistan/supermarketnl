import ContactCMS, { getDefaultContactCMS } from '../models/ContactCMS.js';
import FooterCMS from '../models/FooterCMS.js';

const ensureContactSettings = async () => {
  let doc = await ContactCMS.findOne();
  if (!doc) {
    doc = await ContactCMS.create(getDefaultContactCMS());
  }
  return doc;
};

const getSocialLinks = async () => {
  const footer = await FooterCMS.findOne().lean();
  const links = footer?.socialLinks || {};
  return {
    facebookUrl: links.facebook || '',
    instagramUrl: links.instagram || '',
    whatsappUrl: links.whatsapp || '',
    tiktokUrl: links.tiktok || '',
    youtubeUrl: links.youtube || '',
  };
};

export const mapDocToApi = (doc, socialLinks = {}) => ({
  id: doc._id,
  phoneNumber: doc.phoneNumber,
  phoneSubtext: doc.phoneSubtext,
  emailAddress: doc.email,
  emailSubtext: doc.emailSubtext,
  storeName: doc.storeName,
  storeAddress: doc.address,
  supermarketOpeningHours: doc.supermarketHours,
  foodCornerOpeningHours: doc.foodCornerHours,
  holidayNote: doc.holidayNote,
  heroBadge: doc.heroSection?.heroBadge || '',
  heroTitle: doc.heroSection?.heroTitle || '',
  heroSubtitle: doc.heroSection?.heroSubtitle || '',
  heroFeature1: doc.heroSection?.heroFeature1 || '',
  heroFeature2: doc.heroSection?.heroFeature2 || '',
  heroFeature3: doc.heroSection?.heroFeature3 || '',
  formTitle: doc.contactFormSettings?.formTitle || '',
  formSubtitle: doc.contactFormSettings?.formSubtitle || '',
  submitButtonText: doc.contactFormSettings?.submitButtonText || '',
  fullNameLabel: doc.contactFormSettings?.fullNameLabel || '',
  fullNamePlaceholder: doc.contactFormSettings?.fullNamePlaceholder || '',
  emailLabel: doc.contactFormSettings?.emailLabel || '',
  emailPlaceholder: doc.contactFormSettings?.emailPlaceholder || '',
  phoneLabel: doc.contactFormSettings?.phoneLabel || '',
  phonePlaceholder: doc.contactFormSettings?.phonePlaceholder || '',
  subjectLabel: doc.contactFormSettings?.subjectLabel || '',
  subjectPlaceholder: doc.contactFormSettings?.subjectPlaceholder || '',
  messageLabel: doc.contactFormSettings?.messageLabel || '',
  messagePlaceholder: doc.contactFormSettings?.messagePlaceholder || '',
  privacyNote: doc.contactFormSettings?.privacyNote || '',
  infoCardTitle: doc.infoCard?.infoCardTitle || '',
  infoCardSubtitle: doc.infoCard?.infoCardSubtitle || '',
  helpBoxTitle: doc.helpBox?.helpBoxTitle || '',
  helpBoxSubtitle: doc.helpBox?.helpBoxSubtitle || '',
  googleMapsEmbedUrl: doc.googleMapUrl,
  facebookUrl: socialLinks.facebookUrl || '',
  instagramUrl: socialLinks.instagramUrl || '',
  whatsappUrl: socialLinks.whatsappUrl || '',
  tiktokUrl: socialLinks.tiktokUrl || '',
  youtubeUrl: socialLinks.youtubeUrl || '',
  createdAt: doc.createdAt,
  updatedAt: doc.updatedAt,
});

const apiPayloadToMongoUpdate = (body = {}) => {
  const update = {};

  if (body.phoneNumber !== undefined) update.phoneNumber = body.phoneNumber;
  if (body.phoneSubtext !== undefined) update.phoneSubtext = body.phoneSubtext;
  if (body.emailAddress !== undefined) update.email = body.emailAddress;
  if (body.emailSubtext !== undefined) update.emailSubtext = body.emailSubtext;
  if (body.storeName !== undefined) update.storeName = body.storeName;
  if (body.storeAddress !== undefined) update.address = body.storeAddress;
  if (body.supermarketOpeningHours !== undefined) update.supermarketHours = body.supermarketOpeningHours;
  if (body.foodCornerOpeningHours !== undefined) update.foodCornerHours = body.foodCornerOpeningHours;
  if (body.holidayNote !== undefined) update.holidayNote = body.holidayNote;
  if (body.googleMapsEmbedUrl !== undefined) update.googleMapUrl = body.googleMapsEmbedUrl;

  const heroMap = {
    heroBadge: 'heroSection.heroBadge',
    heroTitle: 'heroSection.heroTitle',
    heroSubtitle: 'heroSection.heroSubtitle',
    heroFeature1: 'heroSection.heroFeature1',
    heroFeature2: 'heroSection.heroFeature2',
    heroFeature3: 'heroSection.heroFeature3',
  };

  Object.entries(heroMap).forEach(([apiKey, mongoKey]) => {
    if (body[apiKey] !== undefined) update[mongoKey] = body[apiKey];
  });

  const formMap = {
    formTitle: 'contactFormSettings.formTitle',
    formSubtitle: 'contactFormSettings.formSubtitle',
    submitButtonText: 'contactFormSettings.submitButtonText',
    fullNameLabel: 'contactFormSettings.fullNameLabel',
    fullNamePlaceholder: 'contactFormSettings.fullNamePlaceholder',
    emailLabel: 'contactFormSettings.emailLabel',
    emailPlaceholder: 'contactFormSettings.emailPlaceholder',
    phoneLabel: 'contactFormSettings.phoneLabel',
    phonePlaceholder: 'contactFormSettings.phonePlaceholder',
    subjectLabel: 'contactFormSettings.subjectLabel',
    subjectPlaceholder: 'contactFormSettings.subjectPlaceholder',
    messageLabel: 'contactFormSettings.messageLabel',
    messagePlaceholder: 'contactFormSettings.messagePlaceholder',
    privacyNote: 'contactFormSettings.privacyNote',
  };

  Object.entries(formMap).forEach(([apiKey, mongoKey]) => {
    if (body[apiKey] !== undefined) update[mongoKey] = body[apiKey];
  });

  if (body.infoCardTitle !== undefined) update['infoCard.infoCardTitle'] = body.infoCardTitle;
  if (body.infoCardSubtitle !== undefined) update['infoCard.infoCardSubtitle'] = body.infoCardSubtitle;
  if (body.helpBoxTitle !== undefined) update['helpBox.helpBoxTitle'] = body.helpBoxTitle;
  if (body.helpBoxSubtitle !== undefined) update['helpBox.helpBoxSubtitle'] = body.helpBoxSubtitle;

  return update;
};

const normalizePayload = (body = {}) => {
  const allowedKeys = [
    'phoneNumber',
    'phoneSubtext',
    'emailAddress',
    'emailSubtext',
    'storeName',
    'storeAddress',
    'supermarketOpeningHours',
    'foodCornerOpeningHours',
    'holidayNote',
    'heroBadge',
    'heroTitle',
    'heroSubtitle',
    'heroFeature1',
    'heroFeature2',
    'heroFeature3',
    'formTitle',
    'formSubtitle',
    'submitButtonText',
    'fullNameLabel',
    'fullNamePlaceholder',
    'emailLabel',
    'emailPlaceholder',
    'phoneLabel',
    'phonePlaceholder',
    'subjectLabel',
    'subjectPlaceholder',
    'messageLabel',
    'messagePlaceholder',
    'privacyNote',
    'infoCardTitle',
    'infoCardSubtitle',
    'helpBoxTitle',
    'helpBoxSubtitle',
    'googleMapsEmbedUrl',
  ];

  const normalized = {};
  allowedKeys.forEach((key) => {
    if (body[key] !== undefined) {
      normalized[key] = typeof body[key] === 'string' ? body[key].trim() : body[key];
    }
  });
  return normalized;
};

export const getContactSettings = async () => {
  const doc = await ensureContactSettings();
  const socialLinks = await getSocialLinks();
  return mapDocToApi(doc, socialLinks);
};

export const updateContactSettings = async (body) => {
  const payload = normalizePayload(body);
  if (!Object.keys(payload).length) {
    const error = new Error('No valid fields provided for update');
    error.statusCode = 400;
    throw error;
  }

  const existing = await ensureContactSettings();
  const mongoUpdate = apiPayloadToMongoUpdate(payload);
  const doc = await ContactCMS.findByIdAndUpdate(existing._id, { $set: mongoUpdate }, { new: true });
  const socialLinks = await getSocialLinks();
  return mapDocToApi(doc, socialLinks);
};

export default {
  getContactSettings,
  updateContactSettings,
};
