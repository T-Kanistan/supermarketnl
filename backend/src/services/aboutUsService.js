import mongoose from 'mongoose';
import AboutUsCMS, {
  getDefaultAboutCMS,
  migrateLegacyAboutDoc,
  LEGACY_FIELDS,
} from '../models/AboutCMS.js';
import { deleteLocalImage, toPublicUrl } from '../middleware/upload.js';

const IMAGE_FIELD_MAP = {
  homepage: 'homepageAboutSection.image',
  hero: 'heroSection.heroImage',
  story: 'storySection.image',
  owner: 'ownerDetails.ownerPhoto',
};

const needsMigration = (raw) => {
  const hasLegacy =
    raw.pageHeading ||
    raw.homepageDescription ||
    raw.aboutDescription ||
    raw.heroEyebrow ||
    raw.stats?.length;
  const nestedEmpty = !raw.heroSection?.pageHeading?.trim();
  return Boolean(hasLegacy && nestedEmpty);
};

const ensureAboutUs = async () => {
  let doc = await AboutUsCMS.findOne();

  if (!doc) {
    doc = await AboutUsCMS.create(getDefaultAboutCMS());
    return doc;
  }

  const raw = doc.toObject();
  if (needsMigration(raw)) {
    const migrated = migrateLegacyAboutDoc(raw);
    doc.set(migrated);
    LEGACY_FIELDS.forEach((field) => {
      doc.set(field, undefined);
    });
    doc.markModified('homepageAboutSection');
    doc.markModified('heroSection');
    doc.markModified('storySection');
    doc.markModified('missionVisionPromise');
    doc.markModified('whatWeOffer');
    doc.markModified('statistics');
    doc.markModified('ownerDetails');
    await doc.save();
  }

  return doc;
};

const sortByDisplayOrder = (items = []) =>
  [...items].sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));

const mapOfferToApi = (offer) => ({
  id: offer._id,
  categoryName: offer.categoryName,
  description: offer.description,
  imageUrl: offer.imageUrl || '',
  displayOrder: offer.displayOrder ?? 0,
  isActive: offer.isActive !== false,
  createdAt: offer.createdAt,
  updatedAt: offer.updatedAt,
});

const mapStatisticToApi = (stat) => ({
  id: stat._id,
  value: stat.value ?? 0,
  suffix: stat.suffix || '',
  label: stat.label || '',
  displayOrder: stat.displayOrder ?? 0,
  createdAt: stat.createdAt,
  updatedAt: stat.updatedAt,
});

export const mapDocToApi = (doc, { activeOffersOnly = false } = {}) => {
  const offers = sortByDisplayOrder(doc.whatWeOffer || []);
  const statistics = sortByDisplayOrder(doc.statistics || []);

  const filteredOffers = activeOffersOnly
    ? offers.filter((offer) => offer.isActive !== false)
    : offers;

  return {
    id: doc._id,
    homepageShortDescription: doc.homepageShortDescription || '',
    homepageAboutSection: {
      buttonText: doc.homepageAboutSection?.buttonText || '',
      features: doc.homepageAboutSection?.features || [],
      image: doc.homepageAboutSection?.image || '',
    },
    heroSection: {
      eyebrowTag: doc.heroSection?.eyebrowTag || '',
      pageHeading: doc.heroSection?.pageHeading || '',
      highlightedWord: doc.heroSection?.highlightedWord || '',
      description: doc.heroSection?.description || '',
      imageBadgeText: doc.heroSection?.imageBadgeText || '',
      heroImage: doc.heroSection?.heroImage || '',
    },
    storySection: {
      title: doc.storySection?.title || '',
      description: doc.storySection?.description || '',
      image: doc.storySection?.image || '',
    },
    missionVisionPromise: {
      missionTitle: doc.missionVisionPromise?.missionTitle || '',
      missionDescription: doc.missionVisionPromise?.missionDescription || '',
      visionTitle: doc.missionVisionPromise?.visionTitle || '',
      visionDescription: doc.missionVisionPromise?.visionDescription || '',
      promiseTitle: doc.missionVisionPromise?.promiseTitle || '',
      promiseDescription: doc.missionVisionPromise?.promiseDescription || '',
    },
    whatWeOffer: filteredOffers.map(mapOfferToApi),
    statistics: statistics.map(mapStatisticToApi),
    ownerDetails: {
      ownerPhoto: doc.ownerDetails?.ownerPhoto || '',
      ownerName: doc.ownerDetails?.ownerName || '',
      designation: doc.ownerDetails?.designation || '',
      phoneNumber: doc.ownerDetails?.phoneNumber || '',
      location: doc.ownerDetails?.location || '',
      badgeText: doc.ownerDetails?.badgeText || '',
      ownerQuote: doc.ownerDetails?.ownerQuote || '',
    },
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
};

const parseJsonField = (value) => {
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
};

const normalizeUpdateBody = (body = {}) => {
  const payload = { ...body };

  if (payload.homepageAboutSection && typeof payload.homepageAboutSection === 'string') {
    payload.homepageAboutSection = parseJsonField(payload.homepageAboutSection);
  }
  if (payload.heroSection && typeof payload.heroSection === 'string') {
    payload.heroSection = parseJsonField(payload.heroSection);
  }
  if (payload.storySection && typeof payload.storySection === 'string') {
    payload.storySection = parseJsonField(payload.storySection);
  }
  if (payload.missionVisionPromise && typeof payload.missionVisionPromise === 'string') {
    payload.missionVisionPromise = parseJsonField(payload.missionVisionPromise);
  }
  if (payload.ownerDetails && typeof payload.ownerDetails === 'string') {
    payload.ownerDetails = parseJsonField(payload.ownerDetails);
  }

  return payload;
};

const validateCmsPayload = (doc, body) => {
  const errors = [];

  const homepageShortDescription =
    body.homepageShortDescription ?? doc.homepageShortDescription;
  const pageHeading = body.heroSection?.pageHeading ?? doc.heroSection?.pageHeading;
  const storyTitle = body.storySection?.title ?? doc.storySection?.title;
  const missionTitle =
    body.missionVisionPromise?.missionTitle ?? doc.missionVisionPromise?.missionTitle;
  const visionTitle =
    body.missionVisionPromise?.visionTitle ?? doc.missionVisionPromise?.visionTitle;
  const ownerName = body.ownerDetails?.ownerName ?? doc.ownerDetails?.ownerName;

  if (!pageHeading?.trim()) {
    errors.push({ field: 'heroSection.pageHeading', message: 'Page heading is required' });
  }
  if (!storyTitle?.trim()) {
    errors.push({ field: 'storySection.title', message: 'Story title is required' });
  }
  if (!missionTitle?.trim()) {
    errors.push({ field: 'missionVisionPromise.missionTitle', message: 'Mission title is required' });
  }
  if (!visionTitle?.trim()) {
    errors.push({ field: 'missionVisionPromise.visionTitle', message: 'Vision title is required' });
  }
  if (!ownerName?.trim()) {
    errors.push({ field: 'ownerDetails.ownerName', message: 'Owner name is required' });
  }

  const offers = body.whatWeOffer ?? doc.whatWeOffer;
  if (!offers?.length) {
    errors.push({ field: 'whatWeOffer', message: 'At least one offer is required' });
  }

  const statistics = body.statistics ?? doc.statistics;
  if (!statistics?.length) {
    errors.push({ field: 'statistics', message: 'At least one statistic is required' });
  }

  if (errors.length) {
    const error = new Error('Validation failed');
    error.statusCode = 400;
    error.errors = errors;
    throw error;
  }
};

const applyNestedUpdate = (doc, body) => {
  if (body.homepageShortDescription !== undefined) {
    doc.homepageShortDescription = body.homepageShortDescription;
  }

  if (body.homepageAboutSection) {
    doc.homepageAboutSection = {
      ...doc.homepageAboutSection?.toObject?.() || doc.homepageAboutSection || {},
      ...body.homepageAboutSection,
    };
    doc.markModified('homepageAboutSection');
  }

  if (body.heroSection) {
    doc.heroSection = {
      ...doc.heroSection?.toObject?.() || doc.heroSection || {},
      ...body.heroSection,
    };
    doc.markModified('heroSection');
  }

  if (body.storySection) {
    doc.storySection = {
      ...doc.storySection?.toObject?.() || doc.storySection || {},
      ...body.storySection,
    };
    doc.markModified('storySection');
  }

  if (body.missionVisionPromise) {
    doc.missionVisionPromise = {
      ...doc.missionVisionPromise?.toObject?.() || doc.missionVisionPromise || {},
      ...body.missionVisionPromise,
    };
    doc.markModified('missionVisionPromise');
  }

  if (body.ownerDetails) {
    doc.ownerDetails = {
      ...doc.ownerDetails?.toObject?.() || doc.ownerDetails || {},
      ...body.ownerDetails,
    };
    doc.markModified('ownerDetails');
  }

  if (Array.isArray(body.whatWeOffer)) {
    doc.whatWeOffer = body.whatWeOffer.map((offer, index) => {
      const item = {
        categoryName: offer.categoryName,
        description: offer.description || '',
        imageUrl: offer.imageUrl || '',
        displayOrder: offer.displayOrder ?? index + 1,
        isActive: offer.isActive !== false,
      };
      const offerId = offer.id || offer._id;
      if (offerId && mongoose.Types.ObjectId.isValid(offerId)) {
        item._id = offerId;
      }
      return item;
    });
    doc.markModified('whatWeOffer');
  }

  if (Array.isArray(body.statistics)) {
    doc.statistics = body.statistics.map((stat, index) => {
      const item = {
        value: Number(stat.value) || 0,
        suffix: stat.suffix || '',
        label: stat.label || '',
        displayOrder: stat.displayOrder ?? index + 1,
      };
      const statId = stat.id || stat._id;
      if (statId && mongoose.Types.ObjectId.isValid(statId)) {
        item._id = statId;
      }
      return item;
    });
    doc.markModified('statistics');
  }
};

const getImageUrlFromDoc = (doc, type) => {
  const paths = {
    homepage: doc.homepageAboutSection?.image,
    hero: doc.heroSection?.heroImage,
    story: doc.storySection?.image,
    owner: doc.ownerDetails?.ownerPhoto,
  };
  return paths[type];
};

export const getAboutUs = async () => {
  const doc = await ensureAboutUs();
  return mapDocToApi(doc, { activeOffersOnly: true });
};

export const getAboutUsAdmin = async () => {
  const doc = await ensureAboutUs();
  return mapDocToApi(doc, { activeOffersOnly: false });
};

export const updateAboutUs = async (body) => {
  const doc = await ensureAboutUs();
  const payload = normalizeUpdateBody(body);

  validateCmsPayload(doc, payload);
  applyNestedUpdate(doc, payload);
  await doc.save();

  return mapDocToApi(doc, { activeOffersOnly: false });
};

export const uploadAboutImage = async (type, file) => {
  if (!IMAGE_FIELD_MAP[type]) {
    const error = new Error('Invalid image upload type');
    error.statusCode = 400;
    throw error;
  }

  const doc = await ensureAboutUs();
  const fieldPath = IMAGE_FIELD_MAP[type];
  const previousUrl = getImageUrlFromDoc(doc, type);

  if (previousUrl?.startsWith('/uploads/')) {
    deleteLocalImage(previousUrl);
  }

  const imageUrl = toPublicUrl(file);
  const update = { [fieldPath]: imageUrl };
  const updated = await AboutUsCMS.findByIdAndUpdate(doc._id, { $set: update }, { new: true });

  return {
    imageUrl,
    cms: mapDocToApi(updated, { activeOffersOnly: false }),
  };
};

export const listOffers = async (activeOnly = false) => {
  const doc = await ensureAboutUs();
  const offers = sortByDisplayOrder(doc.whatWeOffer || []);
  const filtered = activeOnly
    ? offers.filter((offer) => offer.isActive !== false)
    : offers;
  return filtered.map(mapOfferToApi);
};

export const createOffer = async (body) => {
  const doc = await ensureAboutUs();
  const maxOrder = (doc.whatWeOffer || []).reduce(
    (max, item) => Math.max(max, item.displayOrder || 0),
    0
  );

  doc.whatWeOffer.push({
    categoryName: body.categoryName,
    description: body.description || '',
    imageUrl: body.imageUrl || '',
    displayOrder: body.displayOrder ?? maxOrder + 1,
    isActive: body.isActive !== false,
  });

  await doc.save();
  const created = doc.whatWeOffer[doc.whatWeOffer.length - 1];
  return mapOfferToApi(created);
};

export const updateOffer = async (id, body) => {
  const doc = await ensureAboutUs();
  const offer = doc.whatWeOffer.id(id);
  if (!offer) {
    const error = new Error('Offer not found');
    error.statusCode = 404;
    throw error;
  }

  if (body.categoryName !== undefined) offer.categoryName = body.categoryName;
  if (body.description !== undefined) offer.description = body.description;
  if (body.imageUrl !== undefined) offer.imageUrl = body.imageUrl;
  if (body.displayOrder !== undefined) offer.displayOrder = body.displayOrder;
  if (body.isActive !== undefined) offer.isActive = body.isActive;

  await doc.save();
  return mapOfferToApi(offer);
};

export const deleteOffer = async (id) => {
  const doc = await ensureAboutUs();
  const offer = doc.whatWeOffer.id(id);
  if (!offer) {
    const error = new Error('Offer not found');
    error.statusCode = 404;
    throw error;
  }

  offer.deleteOne();
  await doc.save();
};

export const reorderOffers = async (orders = []) => {
  const doc = await ensureAboutUs();

  orders.forEach(({ id, displayOrder }) => {
    const offer = doc.whatWeOffer.id(id);
    if (offer && displayOrder !== undefined) {
      offer.displayOrder = displayOrder;
    }
  });

  await doc.save();
  return listOffers(false);
};

export const listStatistics = async () => {
  const doc = await ensureAboutUs();
  return sortByDisplayOrder(doc.statistics || []).map(mapStatisticToApi);
};

export const createStatistic = async (body) => {
  const doc = await ensureAboutUs();
  const maxOrder = (doc.statistics || []).reduce(
    (max, item) => Math.max(max, item.displayOrder || 0),
    0
  );

  doc.statistics.push({
    value: Number(body.value) || 0,
    suffix: body.suffix || '',
    label: body.label || '',
    displayOrder: body.displayOrder ?? maxOrder + 1,
  });

  await doc.save();
  const created = doc.statistics[doc.statistics.length - 1];
  return mapStatisticToApi(created);
};

export const updateStatistic = async (id, body) => {
  const doc = await ensureAboutUs();
  const stat = doc.statistics.id(id);
  if (!stat) {
    const error = new Error('Statistic not found');
    error.statusCode = 404;
    throw error;
  }

  if (body.value !== undefined) stat.value = Number(body.value) || 0;
  if (body.suffix !== undefined) stat.suffix = body.suffix;
  if (body.label !== undefined) stat.label = body.label;
  if (body.displayOrder !== undefined) stat.displayOrder = body.displayOrder;

  await doc.save();
  return mapStatisticToApi(stat);
};

export const deleteStatistic = async (id) => {
  const doc = await ensureAboutUs();
  const stat = doc.statistics.id(id);
  if (!stat) {
    const error = new Error('Statistic not found');
    error.statusCode = 404;
    throw error;
  }

  stat.deleteOne();
  await doc.save();
};

export default {
  getAboutUs,
  getAboutUsAdmin,
  updateAboutUs,
  uploadAboutImage,
  listOffers,
  createOffer,
  updateOffer,
  deleteOffer,
  reorderOffers,
  listStatistics,
  createStatistic,
  updateStatistic,
  deleteStatistic,
  mapDocToApi,
};
