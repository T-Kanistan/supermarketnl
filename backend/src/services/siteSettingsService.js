import SiteSettings, { getDefaultSiteSettings } from '../models/SiteSettings.js';
import HomeCMS, { getDefaultHomeCMS } from '../models/HomeCMS.js';
import ContactCMS, { getDefaultContactCMS } from '../models/ContactCMS.js';
import FooterCMS, { getDefaultFooterCMS } from '../models/FooterCMS.js';
import HomepageBanner from '../models/HomepageBanner.js';
import { handleImageUpload, handleBase64Upload } from '../middlewares/uploadMiddleware.js';

const uploadIfBase64 = async (value) => {
  if (!value || typeof value !== 'string' || !value.startsWith('data:image')) return value;
  return (await handleBase64Upload(value)) || value;
};

const mapDocToApi = (doc) => ({
  storeName: doc.storeName,
  storeLogo: doc.storeLogo,
  physicalAddress: doc.physicalAddress,
  supermarketOpeningHours: doc.supermarketOpeningHours,
  foodCornerOpeningHours: doc.foodCornerOpeningHours,
});

const normalizeIncomingBody = (body = {}) => ({
  storeName: body.storeName,
  storeLogo: body.storeLogo ?? body.logo,
  physicalAddress: body.physicalAddress ?? body.address,
  supermarketOpeningHours: body.supermarketOpeningHours ?? body.supermarketTimings,
  foodCornerOpeningHours: body.foodCornerOpeningHours ?? body.foodCornerTimings,
});

export const syncRelatedStores = async (settings) => {
  const {
    storeName,
    storeLogo,
    physicalAddress,
    supermarketOpeningHours,
    foodCornerOpeningHours,
  } = settings;

  let home = await HomeCMS.findOne();
  if (!home) {
    home = await HomeCMS.create(getDefaultHomeCMS());
  }
  home.storeName = storeName;
  home.logo = storeLogo;
  home.supermarketTimings = supermarketOpeningHours;
  home.foodCornerTimings = foodCornerOpeningHours;
  await home.save();

  let contact = await ContactCMS.findOne();
  if (!contact) {
    contact = await ContactCMS.create(getDefaultContactCMS());
  }
  contact.storeName = storeName;
  contact.address = physicalAddress;
  contact.supermarketHours = supermarketOpeningHours;
  contact.foodCornerHours = foodCornerOpeningHours;
  await contact.save();

  let footer = await FooterCMS.findOne();
  if (!footer) {
    footer = await FooterCMS.create(getDefaultFooterCMS());
  }
  footer.contact = footer.contact || {};
  footer.contact.address = physicalAddress;
  footer.businessHours = footer.businessHours || {};
  footer.businessHours.supermarket = supermarketOpeningHours;
  footer.businessHours.foodCorner = foodCornerOpeningHours;
  footer.markModified('contact');
  footer.markModified('businessHours');
  await footer.save();

  const banner = await HomepageBanner.findOne({ status: 'active' }).sort({ updatedAt: -1 });
  if (banner) {
    banner.supermarketHours = supermarketOpeningHours;
    banner.foodCornerHours = foodCornerOpeningHours;
    await banner.save();
  }
};

const ensureSiteSettings = async () => {
  let settings = await SiteSettings.findOne();
  if (settings) return settings;

  const home = (await HomeCMS.findOne()) || (await HomeCMS.create(getDefaultHomeCMS()));
  const contact = (await ContactCMS.findOne()) || (await ContactCMS.create(getDefaultContactCMS()));

  settings = await SiteSettings.create({
    storeName: home.storeName,
    storeLogo: home.logo,
    physicalAddress: contact.address || '',
    supermarketOpeningHours: home.supermarketTimings,
    foodCornerOpeningHours: home.foodCornerTimings,
  });

  return settings;
};

export const getSiteSettings = async () => {
  const settings = await ensureSiteSettings();
  const apiSettings = mapDocToApi(settings);
  console.log('Fetching Settings:', apiSettings);
  return apiSettings;
};

export const updateSiteSettings = async (body = {}, file, user) => {
  const incoming = normalizeIncomingBody(body);
  let settings = await ensureSiteSettings();

  if (incoming.storeName !== undefined) settings.storeName = String(incoming.storeName).trim();
  if (incoming.physicalAddress !== undefined) {
    settings.physicalAddress = String(incoming.physicalAddress).trim();
  }
  if (incoming.supermarketOpeningHours !== undefined) {
    settings.supermarketOpeningHours = String(incoming.supermarketOpeningHours).trim();
  }
  if (incoming.foodCornerOpeningHours !== undefined) {
    settings.foodCornerOpeningHours = String(incoming.foodCornerOpeningHours).trim();
  }

  if (file) {
    const logoUrl = await handleImageUpload(file);
    if (logoUrl) settings.storeLogo = logoUrl;
  } else if (incoming.storeLogo !== undefined) {
    settings.storeLogo = await uploadIfBase64(incoming.storeLogo);
  }

  settings.updatedBy = user?._id || null;
  await settings.save();

  await syncRelatedStores(settings);

  const apiSettings = mapDocToApi(settings);
  console.log('Fetching Settings:', apiSettings);
  return apiSettings;
};

export const syncFromHomeCms = async (homeDoc) => {
  if (!homeDoc) return null;

  let settings = await ensureSiteSettings();
  settings.storeName = homeDoc.storeName;
  settings.storeLogo = homeDoc.logo;
  settings.supermarketOpeningHours = homeDoc.supermarketTimings;
  settings.foodCornerOpeningHours = homeDoc.foodCornerTimings;
  await settings.save();

  await syncRelatedStores(settings);
  return mapDocToApi(settings);
};

export default {
  getSiteSettings,
  updateSiteSettings,
  syncRelatedStores,
  syncFromHomeCms,
};
