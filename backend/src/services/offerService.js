import Offer, { OFFER_DISCOUNT_TYPES, OFFER_DEPARTMENT_TYPES } from '../models/Offer.js';
import OfferBanner from '../models/OfferBanner.js';
import OffersHeroBanner from '../models/OffersHeroBanner.js';
import OfferCategory from '../models/OfferCategory.js';
import { handleBase64Upload } from '../middlewares/uploadMiddleware.js';
import { logManagerActivity } from './activityLogService.js';
import {
  buildPublicOfferScheduleFilter,
  getOfferScheduleState,
  isOfferPubliclyVisible,
  mergeScheduleFilter,
  normalizeOfferEndDate,
  normalizeOfferStartDate,
} from '../utils/offerSchedule.js';

const slugify = (value) =>
  String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const parseBoolean = (value) => {
  if (value === true || value === false) return value;
  if (value === 'true' || value === 1 || value === '1') return true;
  if (value === 'false' || value === 0 || value === '0') return false;
  return undefined;
};

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const parseNumber = (value) => {
  if (value === undefined || value === null || value === '') return null;
  const num = Number(value);
  return Number.isNaN(num) ? null : num;
};

const parseDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const expirePastOffers = async () => {
  const now = new Date();
  const result = await Offer.updateMany(
    {
      status: 'active',
      endDate: { $ne: null, $lt: now },
    },
    { $set: { status: 'inactive' } }
  );
  return result.modifiedCount || 0;
};

const resolveImage = async (value) => {
  if (!value) return '';
  if (typeof value === 'string' && value.startsWith('data:image')) {
    return (await handleBase64Upload(value)) || value;
  }
  return value;
};

const normalizeDiscountType = (value) => {
  const raw = String(value || '').trim().toLowerCase();
  if (OFFER_DISCOUNT_TYPES.includes(raw)) return raw;
  if (raw === 'flat-price' || raw === 'flat price' || raw === 'fixed') return 'flat';
  if (raw === 'buy 1 get 1' || raw === 'buy-1-get-1' || raw === 'buy1get1' || raw === 'bxgx') return 'bogo';
  return 'percentage';
};

const normalizeOfferDepartment = (value) => {
  const raw = String(value || '').trim();
  if (raw === 'Food Corner' || raw.toLowerCase() === 'food corner') return 'Food Corner';
  if (OFFER_DEPARTMENT_TYPES.includes(raw)) return raw;
  return 'Supermarket';
};

const resolveStoredDepartment = (plain) =>
  plain?.offerDepartment || plain?.offerType || 'Supermarket';

const buildDepartmentFilter = (department) => {
  const normalized = normalizeOfferDepartment(department);
  if (normalized === 'Supermarket') {
    return {
      $or: [
        { offerDepartment: 'Supermarket' },
        { offerDepartment: { $exists: false }, offerType: { $in: [null, '', 'Supermarket'] } },
        { offerDepartment: { $exists: false }, offerType: { $exists: false } },
        { offerType: 'Supermarket' },
      ],
    };
  }
  return {
    $or: [
      { offerDepartment: normalized },
      { offerType: normalized },
    ],
  };
};

export const formatOffer = (doc) => {
  if (!doc) return null;
  const plain = doc.toObject ? doc.toObject() : { ...doc };
  const { isExpired, isScheduled } = getOfferScheduleState(plain);

  return {
    ...plain,
    id: plain._id?.toString?.() ?? plain.id,
    offerDepartment: resolveStoredDepartment(plain),
    // Legacy alias — kept so existing API consumers are not broken.
    offerType: resolveStoredDepartment(plain),
    discountType: plain.discountType || 'percentage',
    discountValue: plain.discountValue ?? null,
    originalPrice: plain.originalPrice ?? null,
    offerPrice: plain.offerPrice ?? null,
    buttonText: plain.buttonText || 'Enquiry',
    status: plain.status || 'active',
    active: (plain.status || 'active') === 'active',
    featured: Boolean(plain.featured),
    sortOrder: Number.isFinite(plain.sortOrder) ? plain.sortOrder : 0,
    isExpired,
    isScheduled,
    isLive: isOfferPubliclyVisible(plain),
    // Aliases for consumers expecting imageUrl
    imageUrl: plain.image || '',
  };
};

export const buildOfferFilter = (query = {}, { publicOnly = false } = {}) => {
  const filter = {};

  if (publicOnly) {
    filter.status = 'active';
    mergeScheduleFilter(filter);
  } else if (query.status && query.status !== 'all') {
    filter.status = query.status;
  } else {
    filter.status = { $ne: 'deleted' };
  }

  if (query.category && query.category !== 'all') {
    filter.category = new RegExp(`^${escapeRegex(query.category)}$`, 'i');
  }

  const department = query.offerDepartment || query.offerType;
  if (department && department !== 'all') {
    filter.$and = filter.$and || [];
    filter.$and.push(buildDepartmentFilter(department));
  }

  const featured = parseBoolean(query.featured);
  if (featured !== undefined) {
    filter.featured = featured;
  }

  if (query.search) {
    const term = String(query.search).trim();
    if (term) {
      const regex = new RegExp(escapeRegex(term), 'i');
      filter.$and = filter.$and || [];
      filter.$and.push({
        $or: [
          { title: regex },
          { subtitle: regex },
          { category: regex },
          { offerDepartment: regex },
          { offerType: regex },
        ],
      });
    }
  }

  return filter;
};

export const normalizeOfferPayload = async (body) => {
  const title = (body.title || '').trim();
  if (!title) {
    const error = new Error('Offer title is required');
    error.statusCode = 400;
    throw error;
  }

  const category = (body.category || '').trim();
  if (!category) {
    const error = new Error('Offer category is required');
    error.statusCode = 400;
    throw error;
  }

  const imageInput = body.image ?? body.imageUrl;
  if (!imageInput || !String(imageInput).trim()) {
    const error = new Error('Offer image is required');
    error.statusCode = 400;
    throw error;
  }

  const startDate = normalizeOfferStartDate(body.startDate);
  const endDate = normalizeOfferEndDate(body.endDate);
  if (startDate && endDate && endDate < startDate) {
    const error = new Error('End date must be after the start date');
    error.statusCode = 400;
    throw error;
  }

  const payload = {
    title,
    subtitle: (body.subtitle || '').trim(),
    description: (body.description || '').trim(),
    category,
    offerDepartment: normalizeOfferDepartment(body.offerDepartment ?? body.offerType),
    discountType: normalizeDiscountType(body.discountType),
    discountValue: parseNumber(body.discountValue),
    originalPrice: parseNumber(body.originalPrice),
    offerPrice: parseNumber(body.offerPrice),
    offerBadge: (body.offerBadge || '').trim(),
    image: await resolveImage(imageInput),
    bannerImage: body.bannerImage ? await resolveImage(body.bannerImage) : '',
    startDate,
    endDate,
    buttonText: (body.buttonText || '').trim() || 'Enquiry',
    buttonLink: (body.buttonLink || '').trim(),
    featured: parseBoolean(body.featured) ?? false,
    status: ['active', 'inactive'].includes(body.status) ? body.status : 'active',
    sortOrder: parseNumber(body.sortOrder) ?? 0,
  };

  return payload;
};

const hasField = (body, ...keys) => keys.some((key) => body[key] !== undefined);

export const buildPartialOfferUpdate = async (body, existing) => {
  const update = {};
  const existingPlain = existing.toObject ? existing.toObject() : existing;

  if (hasField(body, 'title')) {
    const title = (body.title || '').trim();
    if (!title) {
      const error = new Error('Offer title cannot be empty');
      error.statusCode = 400;
      throw error;
    }
    update.title = title;
  }

  if (hasField(body, 'category')) {
    const category = (body.category || '').trim();
    if (!category) {
      const error = new Error('Offer category cannot be empty');
      error.statusCode = 400;
      throw error;
    }
    update.category = category;
  }

  if (hasField(body, 'offerDepartment', 'offerType')) {
    update.offerDepartment = normalizeOfferDepartment(body.offerDepartment ?? body.offerType);
  }

  if (hasField(body, 'subtitle')) update.subtitle = (body.subtitle || '').trim();
  if (hasField(body, 'description')) update.description = (body.description || '').trim();
  if (hasField(body, 'discountType')) update.discountType = normalizeDiscountType(body.discountType);
  if (hasField(body, 'discountValue')) update.discountValue = parseNumber(body.discountValue);
  if (hasField(body, 'originalPrice')) update.originalPrice = parseNumber(body.originalPrice);
  if (hasField(body, 'offerPrice')) update.offerPrice = parseNumber(body.offerPrice);
  if (hasField(body, 'offerBadge')) update.offerBadge = (body.offerBadge || '').trim();
  if (hasField(body, 'buttonText')) update.buttonText = (body.buttonText || '').trim() || 'Enquiry';
  if (hasField(body, 'buttonLink')) update.buttonLink = (body.buttonLink || '').trim();
  if (hasField(body, 'sortOrder')) update.sortOrder = parseNumber(body.sortOrder) ?? 0;

  if (hasField(body, 'featured')) {
    update.featured = parseBoolean(body.featured) ?? false;
  }

  if (hasField(body, 'status')) {
    if (!['active', 'inactive'].includes(body.status)) {
      const error = new Error('Status must be active or inactive');
      error.statusCode = 400;
      throw error;
    }
    update.status = body.status;
  }

  if (hasField(body, 'startDate')) update.startDate = normalizeOfferStartDate(body.startDate);
  if (hasField(body, 'endDate')) update.endDate = normalizeOfferEndDate(body.endDate);

  const effectiveStart = update.startDate !== undefined ? update.startDate : existingPlain.startDate;
  const effectiveEnd = update.endDate !== undefined ? update.endDate : existingPlain.endDate;
  if (effectiveStart && effectiveEnd && new Date(effectiveEnd) < new Date(effectiveStart)) {
    const error = new Error('End date must be after the start date');
    error.statusCode = 400;
    throw error;
  }

  if (hasField(body, 'image', 'imageUrl')) {
    const imageInput = body.image ?? body.imageUrl;
    update.image = imageInput ? await resolveImage(imageInput) : existingPlain.image || '';
  }

  if (hasField(body, 'bannerImage')) {
    update.bannerImage = body.bannerImage ? await resolveImage(body.bannerImage) : '';
  }

  return update;
};

export const listOffers = async (query = {}, options = {}) => {
  if (options.publicOnly) {
    await expirePastOffers();
  }
  const filter = buildOfferFilter(query, options);
  const offers = await Offer.find(filter).sort({ sortOrder: 1, createdAt: -1 });
  return offers.map(formatOffer);
};

export const getFeaturedOffers = async () => {
  await expirePastOffers();
  const now = new Date();
  const filter = {
    status: 'active',
    featured: true,
    ...buildPublicOfferScheduleFilter(now),
  };
  const offers = await Offer.find(filter).sort({
    sortOrder: 1,
    createdAt: -1,
  });
  return offers.map(formatOffer);
};

export const getOffersByCategory = async (category) => {
  await expirePastOffers();
  const now = new Date();
  const filter = {
    status: 'active',
    category: new RegExp(`^${escapeRegex(category)}$`, 'i'),
    ...buildPublicOfferScheduleFilter(now),
  };
  const offers = await Offer.find(filter).sort({ sortOrder: 1, createdAt: -1 });
  return offers.map(formatOffer);
};

export const getOfferCategories = async ({ publicOnly = false } = {}) => {
  // Primary source: the managed OfferCategory collection (created from the admin).
  const categoryFilter = publicOnly ? { status: 'active' } : {};
  const managed = await OfferCategory.find(categoryFilter).sort({ sortOrder: 1, name: 1 });

  // Union with any categories already referenced by existing offers, so legacy
  // offers whose category was never added to the collection still appear.
  const offerMatch = publicOnly
    ? { status: 'active', ...buildPublicOfferScheduleFilter() }
    : { status: { $ne: 'deleted' } };
  const offerCategories = await Offer.distinct('category', offerMatch);

  const byKey = new Map();
  managed.forEach((cat) => {
    if (!cat?.name) return;
    const trimmed = cat.name.trim();
    byKey.set(trimmed.toLowerCase(), trimmed);
  });
  offerCategories.forEach((name) => {
    if (!name) return;
    const trimmed = String(name).trim();
    const key = trimmed.toLowerCase();
    if (!byKey.has(key)) byKey.set(key, trimmed);
  });

  return Array.from(byKey.values()).sort((a, b) => a.localeCompare(b));
};

// ----- Offer Categories (managed collection) -----

export const formatOfferCategory = (doc) => {
  if (!doc) return null;
  const plain = doc.toObject ? doc.toObject() : { ...doc };
  return {
    ...plain,
    id: plain._id?.toString?.() ?? plain.id,
    name: plain.name,
    slug: plain.slug || slugify(plain.name),
    status: plain.status || 'active',
    active: (plain.status || 'active') === 'active',
    sortOrder: Number.isFinite(plain.sortOrder) ? plain.sortOrder : 0,
  };
};

export const listOfferCategoriesAdmin = async () => {
  const categories = await OfferCategory.find().sort({ sortOrder: 1, name: 1 });
  return categories.map(formatOfferCategory);
};

const normalizeCategoryStatus = (value) => {
  if (value === true || value === 'active') return 'active';
  if (value === false || value === 'inactive') return 'inactive';
  return undefined;
};

export const createOfferCategory = async (body, user) => {
  const name = String(body.name || '').trim();
  if (!name) {
    const error = new Error('Category name is required');
    error.statusCode = 400;
    throw error;
  }

  const existing = await OfferCategory.findOne({
    name: new RegExp(`^${escapeRegex(name)}$`, 'i'),
  });
  if (existing) {
    const error = new Error('A category with this name already exists');
    error.statusCode = 409;
    throw error;
  }

  const category = await OfferCategory.create({
    name,
    slug: slugify(name),
    description: String(body.description || '').trim(),
    icon: String(body.icon || '').trim(),
    status: normalizeCategoryStatus(body.status ?? body.active) || 'active',
    sortOrder: parseNumber(body.sortOrder) ?? 0,
    createdBy: user?._id || null,
    updatedBy: user?._id || null,
  });

  await logManagerActivity({
    user,
    action: 'CREATE',
    module: 'OFFER_CATEGORY',
    description: `Created offer category "${category.name}"`,
  });

  return formatOfferCategory(category);
};

export const updateOfferCategory = async (id, body, user) => {
  const category = await OfferCategory.findById(id);
  if (!category) {
    const error = new Error('Category not found');
    error.statusCode = 404;
    throw error;
  }

  if (body.name !== undefined) {
    const name = String(body.name || '').trim();
    if (!name) {
      const error = new Error('Category name cannot be empty');
      error.statusCode = 400;
      throw error;
    }
    const clash = await OfferCategory.findOne({
      _id: { $ne: id },
      name: new RegExp(`^${escapeRegex(name)}$`, 'i'),
    });
    if (clash) {
      const error = new Error('A category with this name already exists');
      error.statusCode = 409;
      throw error;
    }
    category.name = name;
    category.slug = slugify(name);
  }

  if (body.description !== undefined) category.description = String(body.description || '').trim();
  if (body.icon !== undefined) category.icon = String(body.icon || '').trim();
  if (body.sortOrder !== undefined) category.sortOrder = parseNumber(body.sortOrder) ?? 0;

  const status = normalizeCategoryStatus(body.status ?? body.active);
  if (status) category.status = status;

  category.updatedBy = user?._id || null;
  await category.save();

  await logManagerActivity({
    user,
    action: 'UPDATE',
    module: 'OFFER_CATEGORY',
    description: `Updated offer category "${category.name}"`,
  });

  return formatOfferCategory(category);
};

export const updateOfferCategoryStatus = async (id, statusInput, user) => {
  const status = normalizeCategoryStatus(statusInput);
  if (!status) {
    const error = new Error('Status must be active or inactive');
    error.statusCode = 400;
    throw error;
  }

  const category = await OfferCategory.findById(id);
  if (!category) {
    const error = new Error('Category not found');
    error.statusCode = 404;
    throw error;
  }

  category.status = status;
  category.updatedBy = user?._id || null;
  await category.save();

  return formatOfferCategory(category);
};

export const deleteOfferCategory = async (id, user) => {
  const category = await OfferCategory.findById(id);
  if (!category) {
    const error = new Error('Category not found');
    error.statusCode = 404;
    throw error;
  }

  const linkedCount = await Offer.countDocuments({
    status: { $ne: 'deleted' },
    category: new RegExp(`^${escapeRegex(category.name)}$`, 'i'),
  });
  if (linkedCount > 0) {
    const error = new Error(
      `Cannot delete "${category.name}" — it is used by ${linkedCount} offer(s)`
    );
    error.statusCode = 409;
    throw error;
  }

  await OfferCategory.findByIdAndDelete(id);

  await logManagerActivity({
    user,
    action: 'DELETE',
    module: 'OFFER_CATEGORY',
    description: `Deleted offer category "${category.name}"`,
  });

  return { success: true };
};

export const getOfferById = async (id, options = {}) => {
  if (options.publicOnly) {
    await expirePastOffers();
  }

  const filter = { _id: id, status: { $ne: 'deleted' } };
  if (options.publicOnly) filter.status = 'active';

  const offer = await Offer.findOne(filter);
  if (!offer) {
    const error = new Error('Offer not found');
    error.statusCode = 404;
    throw error;
  }

  if (options.publicOnly && !isOfferPubliclyVisible(offer)) {
    const error = new Error('Offer not found');
    error.statusCode = 404;
    throw error;
  }

  return formatOffer(offer);
};

export const createOffer = async (body, user) => {
  const payload = await normalizeOfferPayload(body);
  payload.createdBy = user?._id || null;
  payload.updatedBy = user?._id || null;

  const offer = await Offer.create(payload);

  await logManagerActivity({
    user,
    action: 'CREATE',
    module: 'OFFER',
    description: `Created offer "${offer.title}"`,
  });

  return formatOffer(offer);
};

export const updateOffer = async (id, body, user) => {
  const offer = await Offer.findOne({ _id: id, status: { $ne: 'deleted' } });
  if (!offer) {
    const error = new Error('Offer not found');
    error.statusCode = 404;
    throw error;
  }

  const updateData = await buildPartialOfferUpdate(body, offer);
  if (Object.keys(updateData).length === 0) {
    return formatOffer(offer);
  }

  updateData.updatedBy = user?._id || null;
  const updated = await Offer.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  });

  await logManagerActivity({
    user,
    action: 'UPDATE',
    module: 'OFFER',
    description: `Updated offer "${updated.title}"`,
  });

  return formatOffer(updated);
};

export const softDeleteOffer = async (id, user) => {
  const offer = await Offer.findOne({ _id: id, status: { $ne: 'deleted' } });
  if (!offer) {
    const error = new Error('Offer not found');
    error.statusCode = 404;
    throw error;
  }

  offer.status = 'deleted';
  offer.updatedBy = user?._id || null;
  await offer.save();

  await logManagerActivity({
    user,
    action: 'DELETE',
    module: 'OFFER',
    description: `Deleted offer "${offer.title}"`,
  });

  return { success: true };
};

export const updateOfferStatus = async (id, status, user) => {
  if (!['active', 'inactive'].includes(status)) {
    const error = new Error('Status must be active or inactive');
    error.statusCode = 400;
    throw error;
  }

  const offer = await Offer.findOne({ _id: id, status: { $ne: 'deleted' } });
  if (!offer) {
    const error = new Error('Offer not found');
    error.statusCode = 404;
    throw error;
  }

  offer.status = status;
  offer.updatedBy = user?._id || null;
  await offer.save();

  await logManagerActivity({
    user,
    action: 'UPDATE_STATUS',
    module: 'OFFER',
    description: `Set offer "${offer.title}" status to ${status}`,
  });

  return formatOffer(offer);
};

// ----- Offer Banner (singleton) -----

export const formatOfferBanner = (doc) => {
  if (!doc) return null;
  const plain = doc.toObject ? doc.toObject() : { ...doc };
  return {
    ...plain,
    id: plain._id?.toString?.() ?? plain.id,
  };
};

const getOrCreateBannerDoc = async () => {
  let banner = await OfferBanner.findOne().sort({ updatedAt: -1 });
  if (!banner) {
    banner = await OfferBanner.create({});
  }
  return banner;
};

export const getOfferBanner = async () => {
  const banner = await getOrCreateBannerDoc();
  return formatOfferBanner(banner);
};

export const updateOfferBanner = async (body, user) => {
  const banner = await getOrCreateBannerDoc();

  const fields = [
    'heroTitle',
    'heroSubtitle',
    'heroDescription',
    'heroButtonText',
    'heroButtonLink',
    'heroButton2Text',
    'heroButton2Link',
    'heroOverlayColor',
    'promoTitle',
    'promoSubtitle',
    'promoDescription',
    'promoButtonText',
    'promoButtonLink',
    'promoOverlayColor',
  ];

  for (const field of fields) {
    if (body[field] !== undefined) {
      banner[field] = String(body[field] ?? '').trim();
    }
  }

  if (body.heroOverlayOpacity !== undefined) {
    const opacity = Number(body.heroOverlayOpacity);
    banner.heroOverlayOpacity = Number.isNaN(opacity) ? 0.55 : Math.min(1, Math.max(0, opacity));
  }
  if (body.promoOverlayOpacity !== undefined) {
    const opacity = Number(body.promoOverlayOpacity);
    banner.promoOverlayOpacity = Number.isNaN(opacity) ? 0.45 : Math.min(1, Math.max(0, opacity));
  }

  if (body.heroImage !== undefined) {
    banner.heroImage = body.heroImage ? await resolveImage(body.heroImage) : '';
  }
  if (body.promoImage !== undefined) {
    banner.promoImage = body.promoImage ? await resolveImage(body.promoImage) : '';
  }

  banner.updatedBy = user?._id || null;
  await banner.save();

  await logManagerActivity({
    user,
    action: 'UPDATE',
    module: 'OFFER_BANNER',
    description: 'Updated offers page banner',
  });

  return formatOfferBanner(banner);
};

// ----- Offers Hero Banners (multi-document) -----

const heroBannerStartOfDay = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const heroBannerEndOfDay = (date) => {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
};

export const resolveOffersHeroBannerStatus = (banner, now = new Date()) => {
  const storedStatus = banner.status;
  if (storedStatus === 'deleted') return 'deleted';
  if (storedStatus === 'inactive') return 'inactive';
  if (storedStatus === 'draft') return 'draft';
  if (storedStatus === 'expired') return 'expired';

  const start = heroBannerStartOfDay(banner.startDate);
  const end = heroBannerEndOfDay(banner.endDate);

  if (now > end) return 'expired';
  if (now < start) return storedStatus === 'active' ? 'scheduled' : storedStatus || 'draft';

  return storedStatus || 'draft';
};

export const formatOffersHeroBanner = (doc, now = new Date()) => {
  if (!doc) return null;
  const plain = doc.toObject ? doc.toObject() : { ...doc };
  const image = plain.bannerImage || plain.backgroundImage || '';
  const effectiveStatus = resolveOffersHeroBannerStatus(plain, now);

  return {
    ...plain,
    id: plain._id?.toString?.() ?? plain.id,
    bannerImage: image,
    backgroundImage: image,
    badgeText: plain.badgeText || '',
    title: plain.title || '',
    highlightedTitle: plain.highlightedTitle || '',
    description: plain.description || '',
    buttonText: plain.buttonText || '',
    buttonUrl: plain.buttonUrl || '',
    button2Text: plain.button2Text || '',
    button2Url: plain.button2Url || '',
    overlayColor: plain.overlayColor || '#0f172a',
    overlayOpacity: plain.overlayOpacity ?? 0.55,
    offerType: plain.offerType || 'Supermarket',
    offerCategory: plain.offerCategory || '',
    discountType: plain.discountType || 'percentage',
    discountValue: plain.discountValue ?? null,
    offerBadge: plain.offerBadge || '',
    status: plain.status || 'draft',
    effectiveStatus,
    sortOrder: Number.isFinite(plain.sortOrder) ? plain.sortOrder : 0,
    startDate: plain.startDate ? new Date(plain.startDate).toISOString().split('T')[0] : null,
    endDate: plain.endDate ? new Date(plain.endDate).toISOString().split('T')[0] : null,
  };
};

const migrateSingletonHeroToCollection = async () => {
  const existingCount = await OffersHeroBanner.countDocuments({ status: { $ne: 'deleted' } });
  if (existingCount > 0) return;

  const legacy = await OfferBanner.findOne().sort({ updatedAt: -1 });
  if (!legacy) return;

  const plain = legacy.toObject ? legacy.toObject() : legacy;
  const hasHeroContent = Boolean(
    plain.heroImage
      || plain.heroTitle?.trim()
      || plain.heroSubtitle?.trim()
      || plain.heroDescription?.trim()
  );
  if (!hasHeroContent) return;

  const now = new Date();
  const startDate = heroBannerStartOfDay(now);
  const endDate = heroBannerEndOfDay(new Date(now.getFullYear() + 1, now.getMonth(), now.getDate()));

  await OffersHeroBanner.create({
    bannerImage: plain.heroImage || '',
    backgroundImage: plain.heroImage || '',
    badgeText: plain.heroSubtitle || '',
    title: plain.heroTitle?.trim() || 'Offers',
    highlightedTitle: '',
    description: plain.heroDescription || '',
    buttonText: plain.heroButtonText || '',
    buttonUrl: plain.heroButtonLink || '',
    button2Text: plain.heroButton2Text || '',
    button2Url: plain.heroButton2Link || '',
    overlayColor: plain.heroOverlayColor || '#0f172a',
    overlayOpacity: plain.heroOverlayOpacity ?? 0.55,
    status: 'active',
    startDate,
    endDate,
    sortOrder: 0,
  });
};

export const expireOffersHeroBanners = async () => {
  const now = new Date();
  const result = await OffersHeroBanner.updateMany(
    {
      status: { $in: ['active', 'draft'] },
      endDate: { $lt: heroBannerStartOfDay(now) },
    },
    { $set: { status: 'expired' } }
  );
  return result.modifiedCount || 0;
};

export const getStorefrontOffersHeroBanners = async () => {
  await migrateSingletonHeroToCollection();
  await expireOffersHeroBanners();

  const now = new Date();
  const items = await OffersHeroBanner.find({
    status: 'active',
    startDate: { $lte: heroBannerEndOfDay(now) },
    endDate: { $gte: heroBannerStartOfDay(now) },
  }).sort({ sortOrder: 1, createdAt: -1 });

  return items
    .map((item) => formatOffersHeroBanner(item, now))
    .filter((item) => item.effectiveStatus === 'active');
};

export const listOffersHeroBannersAdmin = async (query = {}) => {
  await expireOffersHeroBanners();
  const filter = { status: { $ne: 'deleted' } };

  if (query.status && query.status !== 'all') {
    if (query.status === 'expired') {
      const now = new Date();
      filter.$or = [
        { status: 'expired' },
        { status: 'active', endDate: { $lt: heroBannerStartOfDay(now) } },
      ];
    } else {
      filter.status = query.status;
    }
  }

  const items = await OffersHeroBanner.find(filter).sort({ sortOrder: 1, createdAt: -1 });
  return items.map((item) => formatOffersHeroBanner(item));
};

export const getOffersHeroBannerById = async (id) => {
  const banner = await OffersHeroBanner.findOne({ _id: id, status: { $ne: 'deleted' } });
  if (!banner) {
    const error = new Error('Hero banner not found');
    error.statusCode = 404;
    throw error;
  }
  return formatOffersHeroBanner(banner);
};

const normalizeOffersHeroBannerPayload = async (body, { isCreate = false, existing = null } = {}) => {
  const title = (body.title ?? existing?.title ?? '').trim();
  if (!title) {
    const error = new Error('Title is required');
    error.statusCode = 400;
    throw error;
  }

  const startDate = body.startDate !== undefined
    ? normalizeOfferStartDate(body.startDate)
    : existing?.startDate || null;
  const endDate = body.endDate !== undefined
    ? normalizeOfferEndDate(body.endDate)
    : existing?.endDate || null;
  if (!startDate || !endDate) {
    const error = new Error('Start date and end date are required');
    error.statusCode = 400;
    throw error;
  }
  if (endDate < startDate) {
    const error = new Error('End date must be after the start date');
    error.statusCode = 400;
    throw error;
  }

  const imageInput = body.bannerImage ?? body.backgroundImage ?? body.heroImage;
  let bannerImage = '';
  if (imageInput !== undefined) {
    bannerImage = imageInput ? await resolveImage(imageInput) : '';
  } else if (isCreate) {
    bannerImage = '';
  }

  const payload = {
    title,
    highlightedTitle: (body.highlightedTitle || '').trim(),
    badgeText: (body.badgeText ?? body.heroSubtitle ?? '').trim(),
    description: (body.description ?? body.heroDescription ?? '').trim(),
    buttonText: (body.buttonText ?? body.heroButtonText ?? '').trim(),
    buttonUrl: (body.buttonUrl ?? body.buttonLink ?? body.heroButtonLink ?? '').trim(),
    button2Text: (body.button2Text ?? body.heroButton2Text ?? '').trim(),
    button2Url: (body.button2Url ?? body.heroButton2Link ?? '').trim(),
    overlayColor: (body.overlayColor ?? body.heroOverlayColor ?? '#0f172a').trim(),
    offerType: normalizeOfferDepartment(body.offerType ?? body.offerDepartment),
    offerCategory: (body.offerCategory ?? body.category ?? '').trim(),
    discountType: normalizeDiscountType(body.discountType),
    discountValue: parseNumber(body.discountValue),
    offerBadge: (body.offerBadge ?? body.badge ?? '').trim(),
    startDate,
    endDate,
    sortOrder: parseNumber(body.sortOrder) ?? 0,
  };

  if (imageInput !== undefined || isCreate) {
    payload.bannerImage = bannerImage;
    payload.backgroundImage = bannerImage;
  }

  if (body.overlayOpacity !== undefined || body.heroOverlayOpacity !== undefined) {
    const opacity = Number(body.overlayOpacity ?? body.heroOverlayOpacity);
    payload.overlayOpacity = Number.isNaN(opacity) ? 0.55 : Math.min(1, Math.max(0, opacity));
  }

  if (body.status !== undefined) {
    const status = String(body.status).trim().toLowerCase();
    if (!['active', 'inactive', 'draft'].includes(status)) {
      const error = new Error('Status must be active, inactive, or draft');
      error.statusCode = 400;
      throw error;
    }
    payload.status = status;
  } else if (isCreate) {
    payload.status = 'draft';
  }

  return payload;
};

export const createOffersHeroBanner = async (body, user) => {
  const payload = await normalizeOffersHeroBannerPayload(body, { isCreate: true });
  payload.createdBy = user?._id || null;
  payload.updatedBy = user?._id || null;

  const banner = await OffersHeroBanner.create(payload);

  await logManagerActivity({
    user,
    action: 'CREATE',
    module: 'OFFERS_HERO_BANNER',
    description: `Created offers hero banner "${banner.title}"`,
  });

  return formatOffersHeroBanner(banner);
};

export const updateOffersHeroBanner = async (id, body, user) => {
  const banner = await OffersHeroBanner.findOne({ _id: id, status: { $ne: 'deleted' } });
  if (!banner) {
    const error = new Error('Hero banner not found');
    error.statusCode = 404;
    throw error;
  }

  const payload = await normalizeOffersHeroBannerPayload(body, { existing: banner });
  Object.assign(banner, payload);
  banner.updatedBy = user?._id || null;
  await banner.save();

  await logManagerActivity({
    user,
    action: 'UPDATE',
    module: 'OFFERS_HERO_BANNER',
    description: `Updated offers hero banner "${banner.title}"`,
  });

  return formatOffersHeroBanner(banner);
};

export const updateOffersHeroBannerStatus = async (id, status, user) => {
  const normalized = String(status || '').trim().toLowerCase();
  if (!['active', 'inactive', 'draft'].includes(normalized)) {
    const error = new Error('Status must be active, inactive, or draft');
    error.statusCode = 400;
    throw error;
  }

  const banner = await OffersHeroBanner.findOne({ _id: id, status: { $ne: 'deleted' } });
  if (!banner) {
    const error = new Error('Hero banner not found');
    error.statusCode = 404;
    throw error;
  }

  banner.status = normalized;
  banner.updatedBy = user?._id || null;
  await banner.save();

  await logManagerActivity({
    user,
    action: 'UPDATE_STATUS',
    module: 'OFFERS_HERO_BANNER',
    description: `Set offers hero banner "${banner.title}" status to ${normalized}`,
  });

  return formatOffersHeroBanner(banner);
};

export const deleteOffersHeroBanner = async (id, user) => {
  const banner = await OffersHeroBanner.findOne({ _id: id, status: { $ne: 'deleted' } });
  if (!banner) {
    const error = new Error('Hero banner not found');
    error.statusCode = 404;
    throw error;
  }

  banner.status = 'deleted';
  banner.updatedBy = user?._id || null;
  await banner.save();

  await logManagerActivity({
    user,
    action: 'DELETE',
    module: 'OFFERS_HERO_BANNER',
    description: `Deleted offers hero banner "${banner.title}"`,
  });

  return { success: true };
};
