import FooterCMS, { getDefaultFooterCMS } from '../models/FooterCMS.js';
import { deleteLocalImage, toPublicUrl } from '../middleware/upload.js';

const LINK_TYPES = {
  quick: 'quickLinks',
  category: 'categoryLinks',
  legal: 'legalLinks',
};

const ensureFooter = async () => {
  let doc = await FooterCMS.findOne();
  if (!doc) {
    doc = await FooterCMS.create(getDefaultFooterCMS());
  }
  return doc;
};

const sortLinks = (links = []) =>
  [...links].sort((a, b) => (a.order || 0) - (b.order || 0) || a.createdAt - b.createdAt);

const mapSettingsToApi = (doc) => ({
  id: doc._id,
  footerLogo: doc.brand?.logo || '/logo.png',
  footerDescription: doc.brand?.description || '',
  facebookUrl: doc.socialLinks?.facebook || '',
  instagramUrl: doc.socialLinks?.instagram || '',
  whatsappUrl: doc.socialLinks?.whatsapp || '',
  tiktokUrl: doc.socialLinks?.tiktok || '',
  youtubeUrl: doc.socialLinks?.youtube || '',
  businessHoursTitle: doc.businessHoursTitle || 'BUSINESS HOURS',
  supermarketLabel: doc.supermarketLabel || 'Supermarket',
  supermarketHours: doc.businessHours?.supermarket || '',
  foodCornerLabel: doc.foodCornerLabel || 'Food Corner',
  foodCornerHours: doc.businessHours?.foodCorner || '',
  specialHoursNote: doc.businessHours?.specialNote || '',
  contactTitle: doc.contactTitle || 'CONTACT',
  address: doc.contact?.address || '',
  phoneNumber: doc.contact?.phone || '',
  emailAddress: doc.contact?.email || '',
  copyrightName: doc.copyrightName || '',
  createdAt: doc.createdAt,
  updatedAt: doc.updatedAt,
});

const mapLinkToApi = (link) => ({
  id: link._id,
  label: link.label,
  url: link.url,
  displayOrder: link.order,
  isVisible: link.show !== false,
  createdAt: link.createdAt,
  updatedAt: link.updatedAt,
});

const normalizeSettingsBody = (body = {}) => {
  const snakeAliases = {
    footer_logo: 'footerLogo',
    footer_description: 'footerDescription',
    facebook_url: 'facebookUrl',
    instagram_url: 'instagramUrl',
    whatsapp_url: 'whatsappUrl',
    tiktok_url: 'tiktokUrl',
    youtube_url: 'youtubeUrl',
    business_hours_title: 'businessHoursTitle',
    supermarket_label: 'supermarketLabel',
    supermarket_hours: 'supermarketHours',
    food_corner_label: 'foodCornerLabel',
    food_corner_hours: 'foodCornerHours',
    special_hours_note: 'specialHoursNote',
    contact_title: 'contactTitle',
    phone_number: 'phoneNumber',
    email_address: 'emailAddress',
    copyright_name: 'copyrightName',
  };

  const allowed = new Set([
    'footerLogo',
    'footerDescription',
    'facebookUrl',
    'instagramUrl',
    'whatsappUrl',
    'tiktokUrl',
    'youtubeUrl',
    'businessHoursTitle',
    'supermarketLabel',
    'supermarketHours',
    'foodCornerLabel',
    'foodCornerHours',
    'specialHoursNote',
    'contactTitle',
    'address',
    'phoneNumber',
    'emailAddress',
    'copyrightName',
  ]);

  const payload = {};

  Object.keys(body).forEach((key) => {
    const camelKey = snakeAliases[key] || key;
    if (allowed.has(camelKey) && body[key] !== undefined) {
      payload[camelKey] = typeof body[key] === 'string' ? body[key].trim() : body[key];
    }
  });

  return payload;
};

const apiPayloadToMongoUpdate = (payload) => {
  const update = {};

  if (payload.footerLogo !== undefined) update['brand.logo'] = payload.footerLogo;
  if (payload.footerDescription !== undefined) update['brand.description'] = payload.footerDescription;
  if (payload.facebookUrl !== undefined) update['socialLinks.facebook'] = payload.facebookUrl;
  if (payload.instagramUrl !== undefined) update['socialLinks.instagram'] = payload.instagramUrl;
  if (payload.whatsappUrl !== undefined) update['socialLinks.whatsapp'] = payload.whatsappUrl;
  if (payload.tiktokUrl !== undefined) update['socialLinks.tiktok'] = payload.tiktokUrl;
  if (payload.youtubeUrl !== undefined) update['socialLinks.youtube'] = payload.youtubeUrl;
  if (payload.businessHoursTitle !== undefined) update.businessHoursTitle = payload.businessHoursTitle;
  if (payload.supermarketLabel !== undefined) update.supermarketLabel = payload.supermarketLabel;
  if (payload.supermarketHours !== undefined) update['businessHours.supermarket'] = payload.supermarketHours;
  if (payload.foodCornerLabel !== undefined) update.foodCornerLabel = payload.foodCornerLabel;
  if (payload.foodCornerHours !== undefined) update['businessHours.foodCorner'] = payload.foodCornerHours;
  if (payload.specialHoursNote !== undefined) update['businessHours.specialNote'] = payload.specialHoursNote;
  if (payload.contactTitle !== undefined) update.contactTitle = payload.contactTitle;
  if (payload.address !== undefined) update['contact.address'] = payload.address;
  if (payload.phoneNumber !== undefined) update['contact.phone'] = payload.phoneNumber;
  if (payload.emailAddress !== undefined) update['contact.email'] = payload.emailAddress;
  if (payload.copyrightName !== undefined) update.copyrightName = payload.copyrightName;

  return update;
};

const normalizeLinkBody = (body = {}) => ({
  label: body.label?.trim(),
  url: body.url?.trim(),
  displayOrder: body.displayOrder !== undefined ? Number(body.displayOrder) : undefined,
  isVisible: body.isVisible !== undefined ? Boolean(body.isVisible) : undefined,
});

const getLinkArray = (doc, type) => doc[LINK_TYPES[type]];

export const getFooterSettings = async () => {
  const doc = await ensureFooter();
  return mapSettingsToApi(doc);
};

export const getFooterFull = async (visibleOnly = false) => {
  const doc = await ensureFooter();
  const filterLinks = (links) => {
    const sorted = sortLinks(links).map(mapLinkToApi);
    return visibleOnly ? sorted.filter((link) => link.isVisible) : sorted;
  };

  return {
    settings: mapSettingsToApi(doc),
    quickLinks: filterLinks(doc.quickLinks),
    categoryLinks: filterLinks(doc.categoryLinks),
    legalLinks: filterLinks(doc.legalLinks),
  };
};

export const updateFooterSettings = async (body) => {
  const existing = await ensureFooter();
  const payload = normalizeSettingsBody(body);
  const mongoUpdate = apiPayloadToMongoUpdate(payload);

  const linkArrays = ['quickLinks', 'categoryLinks', 'legalLinks'];
  let linksChanged = false;

  linkArrays.forEach((key) => {
    if (Array.isArray(body[key])) {
      existing[key] = body[key].map((link, index) => ({
        label: link.label,
        url: link.url || '/',
        show: link.isVisible !== false,
        order: link.displayOrder ?? index + 1,
      }));
      linksChanged = true;
    }
  });

  if (Object.keys(mongoUpdate).length) {
    await FooterCMS.findByIdAndUpdate(existing._id, { $set: mongoUpdate });
  }

  if (linksChanged) {
    existing.markModified('quickLinks');
    existing.markModified('categoryLinks');
    existing.markModified('legalLinks');
    await existing.save();
  }

  if (!Object.keys(mongoUpdate).length && !linksChanged) {
    const error = new Error('No valid fields provided for update');
    error.statusCode = 400;
    throw error;
  }

  const doc = await FooterCMS.findById(existing._id);
  return mapSettingsToApi(doc);
};

export const uploadFooterLogo = async (file) => {
  if (!file) {
    const error = new Error('Footer logo file is required');
    error.statusCode = 400;
    throw error;
  }

  const existing = await ensureFooter();
  if (existing.brand?.logo?.startsWith('/uploads/')) {
    deleteLocalImage(existing.brand.logo);
  }

  const logoUrl = toPublicUrl(file);
  const doc = await FooterCMS.findByIdAndUpdate(
    existing._id,
    { $set: { 'brand.logo': logoUrl } },
    { new: true }
  );
  return { footerLogo: doc.brand.logo };
};

export const deleteFooterLogo = async () => {
  const existing = await ensureFooter();
  if (existing.brand?.logo?.startsWith('/uploads/')) {
    deleteLocalImage(existing.brand.logo);
  }

  const doc = await FooterCMS.findByIdAndUpdate(
    existing._id,
    { $set: { 'brand.logo': '/logo.png' } },
    { new: true }
  );
  return mapSettingsToApi(doc);
};

const listLinks = async (type, visibleOnly = false) => {
  const doc = await ensureFooter();
  const links = sortLinks(getLinkArray(doc, type));
  const mapped = links.map(mapLinkToApi);
  return visibleOnly ? mapped.filter((link) => link.isVisible) : mapped;
};

const createLink = async (type, body) => {
  const doc = await ensureFooter();
  const data = normalizeLinkBody(body);

  if (!data.label) {
    const error = new Error('Label is required');
    error.statusCode = 400;
    throw error;
  }

  const links = getLinkArray(doc, type);
  const maxOrder = links.reduce((max, item) => Math.max(max, item.order || 0), 0);

  links.push({
    label: data.label,
    url: data.url || '/',
    order: data.displayOrder ?? maxOrder + 1,
    show: data.isVisible !== false,
  });

  await doc.save();
  return mapLinkToApi(links[links.length - 1]);
};

const updateLink = async (type, id, body) => {
  const doc = await ensureFooter();
  const link = getLinkArray(doc, type).id(id);
  if (!link) {
    const error = new Error(`${type === 'quick' ? 'Quick' : type === 'category' ? 'Category' : 'Legal'} link not found`);
    error.statusCode = 404;
    throw error;
  }

  const data = normalizeLinkBody(body);
  if (data.label !== undefined) link.label = data.label;
  if (data.url !== undefined) link.url = data.url;
  if (data.displayOrder !== undefined) link.order = data.displayOrder;
  if (data.isVisible !== undefined) link.show = data.isVisible;

  await doc.save();
  return mapLinkToApi(link);
};

const deleteLink = async (type, id) => {
  const doc = await ensureFooter();
  const link = getLinkArray(doc, type).id(id);
  if (!link) {
    const error = new Error(`${type === 'quick' ? 'Quick' : type === 'category' ? 'Category' : 'Legal'} link not found`);
    error.statusCode = 404;
    throw error;
  }

  link.deleteOne();
  await doc.save();
  return { success: true };
};

export const listQuickLinks = async (visibleOnly = false) => listLinks('quick', visibleOnly);
export const createQuickLink = async (body) => createLink('quick', body);
export const updateQuickLink = async (id, body) => updateLink('quick', id, body);
export const deleteQuickLink = async (id) => deleteLink('quick', id);

export const listCategoryLinks = async (visibleOnly = false) => listLinks('category', visibleOnly);
export const createCategoryLink = async (body) => createLink('category', body);
export const updateCategoryLink = async (id, body) => updateLink('category', id, body);
export const deleteCategoryLink = async (id) => deleteLink('category', id);

export const listLegalLinks = async (visibleOnly = false) => listLinks('legal', visibleOnly);
export const createLegalLink = async (body) => createLink('legal', body);
export const updateLegalLink = async (id, body) => updateLink('legal', id, body);
export const deleteLegalLink = async (id) => deleteLink('legal', id);

export default {
  getFooterSettings,
  getFooterFull,
  updateFooterSettings,
  uploadFooterLogo,
  deleteFooterLogo,
  listQuickLinks,
  createQuickLink,
  updateQuickLink,
  deleteQuickLink,
  listCategoryLinks,
  createCategoryLink,
  updateCategoryLink,
  deleteCategoryLink,
  listLegalLinks,
  createLegalLink,
  updateLegalLink,
  deleteLegalLink,
};
