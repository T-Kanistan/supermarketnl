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

const sortByDisplayOrder = (items = []) =>
  [...items].sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));

const isVisibleItem = (item) => item.isActive !== false && item.isDeleted !== true;

const mapTimelineToApi = (item) => ({
  id: item._id,
  marker: item.marker,
  title: item.title,
  description: item.description || '',
  icon: item.icon || 'FiCalendar',
  displayOrder: item.displayOrder ?? 0,
  isActive: item.isActive !== false,
  isDeleted: item.isDeleted === true,
  createdAt: item.createdAt,
  updatedAt: item.updatedAt,
});

const mapMvpCardToApi = (card) => ({
  id: card._id,
  title: card.title,
  icon: card.icon || 'FiTarget',
  description: card.description || '',
  displayOrder: card.displayOrder ?? 0,
  isActive: card.isActive !== false,
  isDeleted: card.isDeleted === true,
  createdAt: card.createdAt,
  updatedAt: card.updatedAt,
});

const mapOfferToApi = (offer) => ({
  id: offer._id,
  categoryName: offer.categoryName,
  description: offer.description,
  imageUrl: offer.imageUrl || '',
  displayOrder: offer.displayOrder ?? 0,
  isActive: offer.isActive !== false,
  isDeleted: offer.isDeleted === true,
  createdAt: offer.createdAt,
  updatedAt: offer.updatedAt,
});

const mapStatisticToApi = (stat) => ({
  id: stat._id,
  value: stat.value ?? 0,
  suffix: stat.suffix || '',
  label: stat.label || '',
  icon: stat.icon || 'FiUsers',
  displayOrder: stat.displayOrder ?? 0,
  isActive: stat.isActive !== false,
  isDeleted: stat.isDeleted === true,
  createdAt: stat.createdAt,
  updatedAt: stat.updatedAt,
});

const buildMvpCardsFromLegacy = (mvp = {}) => [
  {
    title: mvp.missionTitle || 'Our Mission',
    icon: 'FiTarget',
    description: mvp.missionDescription || '',
    displayOrder: 1,
    isActive: true,
  },
  {
    title: mvp.visionTitle || 'Our Vision',
    icon: 'FiEye',
    description: mvp.visionDescription || '',
    displayOrder: 2,
    isActive: true,
  },
  {
    title: mvp.promiseTitle || 'Our Promise',
    icon: 'FiHeart',
    description: mvp.promiseDescription || '',
    displayOrder: 3,
    isActive: true,
  },
];

const seedMissingSections = async (doc) => {
  const defaults = getDefaultAboutCMS();
  let changed = false;

  if (!doc.storyTimeline?.length) {
    doc.storyTimeline = defaults.storyTimeline;
    changed = true;
  }
  if (!doc.mvpCards?.length) {
    doc.mvpCards = buildMvpCardsFromLegacy(doc.missionVisionPromise?.toObject?.() || doc.missionVisionPromise);
    changed = true;
  }
  if (!doc.heroSection?.descriptionParagraphs?.length) {
    const hero = doc.heroSection?.toObject?.() || doc.heroSection || {};
    doc.heroSection = {
      ...hero,
      descriptionParagraphs: defaults.heroSection.descriptionParagraphs,
      button1Text: hero.button1Text || defaults.heroSection.button1Text,
      button1Url: hero.button1Url || defaults.heroSection.button1Url,
      button2Text: hero.button2Text || defaults.heroSection.button2Text,
      button2Url: hero.button2Url || defaults.heroSection.button2Url,
      displayOrder: hero.displayOrder ?? 1,
      isActive: hero.isActive !== false,
    };
    changed = true;
  }

  if (changed) {
    doc.markModified('storyTimeline');
    doc.markModified('mvpCards');
    doc.markModified('heroSection');
    await doc.save();
  }
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

  await seedMissingSections(doc);

  return doc;
};

export const mapDocToApi = (doc, { activeOnly = false } = {}) => {
  const filterList = (items) =>
    activeOnly ? sortByDisplayOrder(items).filter(isVisibleItem) : sortByDisplayOrder(items);

  const timeline = filterList(doc.storyTimeline || []);
  const mvpCards = filterList(doc.mvpCards || []);
  const offers = filterList(doc.whatWeOffer || []);
  const statistics = filterList(doc.statistics || []);

  const hero = doc.heroSection?.toObject?.() || doc.heroSection || {};
  const owner = doc.ownerDetails?.toObject?.() || doc.ownerDetails || {};

  return {
    id: doc._id,
    homepageShortDescription: doc.homepageShortDescription || '',
    homepageAboutSection: {
      buttonText: doc.homepageAboutSection?.buttonText || '',
      features: doc.homepageAboutSection?.features || [],
      image: doc.homepageAboutSection?.image || '',
    },
    heroSection: {
      eyebrowTag: hero.eyebrowTag || '',
      pageHeading: hero.pageHeading || '',
      highlightedWord: hero.highlightedWord || '',
      description: hero.description || '',
      descriptionParagraphs: hero.descriptionParagraphs || [],
      button1Text: hero.button1Text || 'Explore Products',
      button1Url: hero.button1Url || '/products',
      button2Text: hero.button2Text || 'Contact Us',
      button2Url: hero.button2Url || '/contact',
      imageBadgeText: hero.imageBadgeText || '',
      heroImage: hero.heroImage || '',
      displayOrder: hero.displayOrder ?? 1,
      isActive: hero.isActive !== false,
    },
    storySection: {
      title: doc.storySection?.title || '',
      description: doc.storySection?.description || '',
      image: doc.storySection?.image || '',
    },
    storyTimeline: timeline.map(mapTimelineToApi),
    missionVisionPromise: {
      missionTitle: doc.missionVisionPromise?.missionTitle || '',
      missionDescription: doc.missionVisionPromise?.missionDescription || '',
      visionTitle: doc.missionVisionPromise?.visionTitle || '',
      visionDescription: doc.missionVisionPromise?.visionDescription || '',
      promiseTitle: doc.missionVisionPromise?.promiseTitle || '',
      promiseDescription: doc.missionVisionPromise?.promiseDescription || '',
    },
    mvpCards: mvpCards.map(mapMvpCardToApi),
    whatWeOffer: offers.map(mapOfferToApi),
    statistics: statistics.map(mapStatisticToApi),
    ownerDetails: {
      ownerPhoto: owner.ownerPhoto || '',
      ownerName: owner.ownerName || '',
      designation: owner.designation || '',
      phoneNumber: owner.phoneNumber || '',
      location: owner.location || '',
      badgeText: owner.badgeText || '',
      ownerQuote: owner.ownerQuote || '',
      sinceYear: owner.sinceYear || '2022',
      experienceText: owner.experienceText || '',
      isActive: owner.isActive !== false,
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

  if (Array.isArray(body.storyTimeline)) {
    doc.storyTimeline = body.storyTimeline.map((item, index) => {
      const entry = {
        marker: item.marker,
        title: item.title,
        description: item.description || '',
        icon: item.icon || 'FiCalendar',
        displayOrder: item.displayOrder ?? index + 1,
        isActive: item.isActive !== false,
        isDeleted: item.isDeleted === true,
      };
      const itemId = item.id || item._id;
      if (itemId && mongoose.Types.ObjectId.isValid(itemId)) entry._id = itemId;
      return entry;
    });
    doc.markModified('storyTimeline');
  }

  if (Array.isArray(body.mvpCards)) {
    doc.mvpCards = body.mvpCards.map((card, index) => {
      const entry = {
        title: card.title,
        icon: card.icon || 'FiTarget',
        description: card.description || '',
        displayOrder: card.displayOrder ?? index + 1,
        isActive: card.isActive !== false,
        isDeleted: card.isDeleted === true,
      };
      const cardId = card.id || card._id;
      if (cardId && mongoose.Types.ObjectId.isValid(cardId)) entry._id = cardId;
      return entry;
    });
    doc.markModified('mvpCards');
  }

  if (Array.isArray(body.whatWeOffer)) {
    doc.whatWeOffer = body.whatWeOffer.map((offer, index) => {
      const item = {
        categoryName: offer.categoryName,
        description: offer.description || '',
        imageUrl: offer.imageUrl || '',
        displayOrder: offer.displayOrder ?? index + 1,
        isActive: offer.isActive !== false,
        isDeleted: offer.isDeleted === true,
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
        icon: stat.icon || 'FiUsers',
        displayOrder: stat.displayOrder ?? index + 1,
        isActive: stat.isActive !== false,
        isDeleted: stat.isDeleted === true,
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
  return mapDocToApi(doc, { activeOnly: true });
};

export const getAboutUsAdmin = async () => {
  const doc = await ensureAboutUs();
  return mapDocToApi(doc, { activeOnly: false });
};

export const updateAboutUs = async (body) => {
  const doc = await ensureAboutUs();
  const payload = normalizeUpdateBody(body);

  validateCmsPayload(doc, payload);
  applyNestedUpdate(doc, payload);
  await doc.save();

  return mapDocToApi(doc, { activeOnly: false });
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
    cms: mapDocToApi(updated, { activeOnly: false }),
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

export const deleteOffer = async (id, { soft = true } = {}) => {
  const doc = await ensureAboutUs();
  const offer = doc.whatWeOffer.id(id);
  if (!offer) {
    const error = new Error('Offer not found');
    error.statusCode = 404;
    throw error;
  }

  if (soft) {
    offer.isDeleted = true;
    offer.isActive = false;
  } else {
    offer.deleteOne();
  }
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
    icon: body.icon || 'FiUsers',
    displayOrder: body.displayOrder ?? maxOrder + 1,
    isActive: body.isActive !== false,
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
  if (body.icon !== undefined) stat.icon = body.icon;
  if (body.displayOrder !== undefined) stat.displayOrder = body.displayOrder;
  if (body.isActive !== undefined) stat.isActive = body.isActive;

  await doc.save();
  return mapStatisticToApi(stat);
};

export const deleteStatistic = async (id, { soft = true } = {}) => {
  const doc = await ensureAboutUs();
  const stat = doc.statistics.id(id);
  if (!stat) {
    const error = new Error('Statistic not found');
    error.statusCode = 404;
    throw error;
  }

  if (soft) {
    stat.isDeleted = true;
    stat.isActive = false;
  } else {
    stat.deleteOne();
  }
  await doc.save();
};

export const reorderStatistics = async (orders = []) => {
  const doc = await ensureAboutUs();
  orders.forEach(({ id, displayOrder }) => {
    const stat = doc.statistics.id(id);
    if (stat && displayOrder !== undefined) stat.displayOrder = displayOrder;
  });
  await doc.save();
  return listStatistics();
};

export const uploadOfferImage = async (id, file) => {
  const doc = await ensureAboutUs();
  const offer = doc.whatWeOffer.id(id);
  if (!offer) {
    const error = new Error('Offer not found');
    error.statusCode = 404;
    throw error;
  }
  if (offer.imageUrl?.startsWith('/uploads/')) deleteLocalImage(offer.imageUrl);
  offer.imageUrl = toPublicUrl(file);
  await doc.save();
  return mapOfferToApi(offer);
};

// Story timeline CRUD
export const listTimeline = async (activeOnly = false) => {
  const doc = await ensureAboutUs();
  const items = sortByDisplayOrder(doc.storyTimeline || []);
  const filtered = activeOnly ? items.filter(isVisibleItem) : items;
  return filtered.map(mapTimelineToApi);
};

export const createTimelineItem = async (body) => {
  const doc = await ensureAboutUs();
  const maxOrder = (doc.storyTimeline || []).reduce((max, item) => Math.max(max, item.displayOrder || 0), 0);
  doc.storyTimeline.push({
    marker: body.marker,
    title: body.title,
    description: body.description || '',
    icon: body.icon || 'FiCalendar',
    displayOrder: body.displayOrder ?? maxOrder + 1,
    isActive: body.isActive !== false,
  });
  await doc.save();
  return mapTimelineToApi(doc.storyTimeline[doc.storyTimeline.length - 1]);
};

export const updateTimelineItem = async (id, body) => {
  const doc = await ensureAboutUs();
  const item = doc.storyTimeline.id(id);
  if (!item) {
    const error = new Error('Timeline item not found');
    error.statusCode = 404;
    throw error;
  }
  if (body.marker !== undefined) item.marker = body.marker;
  if (body.title !== undefined) item.title = body.title;
  if (body.description !== undefined) item.description = body.description;
  if (body.icon !== undefined) item.icon = body.icon;
  if (body.displayOrder !== undefined) item.displayOrder = body.displayOrder;
  if (body.isActive !== undefined) item.isActive = body.isActive;
  await doc.save();
  return mapTimelineToApi(item);
};

export const deleteTimelineItem = async (id, { soft = true } = {}) => {
  const doc = await ensureAboutUs();
  const item = doc.storyTimeline.id(id);
  if (!item) {
    const error = new Error('Timeline item not found');
    error.statusCode = 404;
    throw error;
  }
  if (soft) {
    item.isDeleted = true;
    item.isActive = false;
  } else {
    item.deleteOne();
  }
  await doc.save();
};

export const reorderTimeline = async (orders = []) => {
  const doc = await ensureAboutUs();
  orders.forEach(({ id, displayOrder }) => {
    const item = doc.storyTimeline.id(id);
    if (item && displayOrder !== undefined) item.displayOrder = displayOrder;
  });
  await doc.save();
  return listTimeline(false);
};

// MVP cards CRUD
export const listMvpCards = async (activeOnly = false) => {
  const doc = await ensureAboutUs();
  const items = sortByDisplayOrder(doc.mvpCards || []);
  const filtered = activeOnly ? items.filter(isVisibleItem) : items;
  return filtered.map(mapMvpCardToApi);
};

export const createMvpCard = async (body) => {
  const doc = await ensureAboutUs();
  const maxOrder = (doc.mvpCards || []).reduce((max, item) => Math.max(max, item.displayOrder || 0), 0);
  doc.mvpCards.push({
    title: body.title,
    icon: body.icon || 'FiTarget',
    description: body.description || '',
    displayOrder: body.displayOrder ?? maxOrder + 1,
    isActive: body.isActive !== false,
  });
  await doc.save();
  return mapMvpCardToApi(doc.mvpCards[doc.mvpCards.length - 1]);
};

export const updateMvpCard = async (id, body) => {
  const doc = await ensureAboutUs();
  const card = doc.mvpCards.id(id);
  if (!card) {
    const error = new Error('MVP card not found');
    error.statusCode = 404;
    throw error;
  }
  if (body.title !== undefined) card.title = body.title;
  if (body.icon !== undefined) card.icon = body.icon;
  if (body.description !== undefined) card.description = body.description;
  if (body.displayOrder !== undefined) card.displayOrder = body.displayOrder;
  if (body.isActive !== undefined) card.isActive = body.isActive;
  await doc.save();
  return mapMvpCardToApi(card);
};

export const deleteMvpCard = async (id, { soft = true } = {}) => {
  const doc = await ensureAboutUs();
  const card = doc.mvpCards.id(id);
  if (!card) {
    const error = new Error('MVP card not found');
    error.statusCode = 404;
    throw error;
  }
  if (soft) {
    card.isDeleted = true;
    card.isActive = false;
  } else {
    card.deleteOne();
  }
  await doc.save();
};

export const reorderMvpCards = async (orders = []) => {
  const doc = await ensureAboutUs();
  orders.forEach(({ id, displayOrder }) => {
    const card = doc.mvpCards.id(id);
    if (card && displayOrder !== undefined) card.displayOrder = displayOrder;
  });
  await doc.save();
  return listMvpCards(false);
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
  uploadOfferImage,
  listStatistics,
  createStatistic,
  updateStatistic,
  deleteStatistic,
  reorderStatistics,
  listTimeline,
  createTimelineItem,
  updateTimelineItem,
  deleteTimelineItem,
  reorderTimeline,
  listMvpCards,
  createMvpCard,
  updateMvpCard,
  deleteMvpCard,
  reorderMvpCards,
  mapDocToApi,
};
