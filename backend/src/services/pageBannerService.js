import Banner, { BANNER_PAGE_TYPES, normalizePageType } from '../models/Banner.js';
import { handleBase64Upload } from '../middlewares/uploadMiddleware.js';
import { logManagerActivity } from './activityLogService.js';

const notDeleted = { deletedAt: null };

const resolveImage = async (value) => {
  if (!value) return '';
  if (typeof value === 'string' && value.startsWith('data:image')) {
    return (await handleBase64Upload(value)) || value;
  }
  return value;
};

const legacyPageType = (pageType) => (pageType === 'foodcorner' ? 'food-corner' : pageType);

export const formatBanner = (doc) => {
  if (!doc) return null;
  const plain = doc.toObject ? doc.toObject() : { ...doc };
  const pageType = normalizePageType(plain.pageType || plain.pageName);
  const title = plain.title || plain.mainHeading || '';
  const highlightedTitle = plain.highlightedTitle || plain.highlightText || '';
  const backgroundImage = plain.backgroundImage || plain.image || '';
  const buttonText = plain.buttonText || plain.button1Text || '';
  const buttonUrl = plain.buttonUrl || plain.button1Url || '';

  return {
    ...plain,
    id: plain._id?.toString?.() ?? plain.id,
    pageType,
    pageName: legacyPageType(pageType),
    title,
    highlightedTitle,
    backgroundImage,
    buttonText,
    buttonUrl,
    sideCardTitle: plain.sideCardTitle || '',
    sideCardDescription: plain.sideCardDescription || '',
    sideCardIcon: plain.sideCardIcon || '',
    isActive: Boolean(plain.isActive),
    overlayOpacity: Number(plain.overlayOpacity ?? 0.55),
    displayOrder: Number(plain.displayOrder ?? 0),
    // Legacy aliases for existing storefront components
    mainHeading: title,
    highlightText: highlightedTitle,
    image: backgroundImage,
    button1Text: buttonText,
    button1Url: buttonUrl,
    button2Text: plain.button2Text || '',
    button2Url: plain.button2Url || '',
    headingLine1: title,
    headingLine2: highlightedTitle,
    headingLine3: plain.badgeText || '',
    subtitle: plain.description || '',
    primaryButtonLabel: buttonText,
    primaryButtonLink: buttonUrl,
    secondaryButtonLabel: plain.button2Text || '',
    secondaryButtonLink: plain.button2Url || '',
    cardTitle: plain.sideCardTitle || '',
    openTimeTitle: plain.sideCardTitle || '',
  };
};

const buildListQuery = ({ pageType, pageName, q, includeInactive = true }) => {
  const query = { ...notDeleted };
  const filterType = normalizePageType(pageType || pageName);
  if (filterType && filterType !== 'all') {
    query.pageType = filterType;
  }
  if (!includeInactive) {
    query.isActive = true;
  }
  if (q?.trim()) {
    const term = q.trim();
    query.$or = [
      { title: { $regex: term, $options: 'i' } },
      { highlightedTitle: { $regex: term, $options: 'i' } },
      { description: { $regex: term, $options: 'i' } },
      { pageType: { $regex: term, $options: 'i' } },
      { badgeText: { $regex: term, $options: 'i' } },
      // Legacy field search for unmigrated records
      { mainHeading: { $regex: term, $options: 'i' } },
      { highlightText: { $regex: term, $options: 'i' } },
      { pageName: { $regex: term, $options: 'i' } },
    ];
  }
  return query;
};

export const listBanners = async ({
  pageType,
  pageName,
  q,
  page = 1,
  limit = 10,
  includeInactive = true,
}) => {
  const safeLimit = Math.min(Math.max(Number(limit) || 10, 1), 100);
  const safePage = Math.max(Number(page) || 1, 1);
  const query = buildListQuery({ pageType, pageName, q, includeInactive });

  const [items, total] = await Promise.all([
    Banner.find(query)
      .sort({ displayOrder: 1, updatedAt: -1 })
      .skip((safePage - 1) * safeLimit)
      .limit(safeLimit),
    Banner.countDocuments(query),
  ]);

  return {
    items: items.map(formatBanner),
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages: Math.ceil(total / safeLimit) || 1,
    },
  };
};

export const getBannerById = async (id) => {
  const banner = await Banner.findOne({ _id: id, ...notDeleted });
  if (!banner) {
    const error = new Error('Banner not found');
    error.statusCode = 404;
    throw error;
  }
  return formatBanner(banner);
};

export const getActiveBannerByPage = async (pageType) => {
  const normalized = normalizePageType(pageType);
  if (!BANNER_PAGE_TYPES.includes(normalized)) {
    const error = new Error('Invalid page type');
    error.statusCode = 400;
    throw error;
  }

  const banner = await Banner.findOne({
    pageType: normalized,
    isActive: true,
    ...notDeleted,
  })
    .sort({ displayOrder: 1, updatedAt: -1 })
    .lean();

  if (!banner) {
    const legacyName = normalized === 'foodcorner' ? 'food-corner' : normalized;
    const legacyBanner = await Banner.findOne({
      pageName: legacyName,
      isActive: true,
      ...notDeleted,
    })
      .sort({ displayOrder: 1, updatedAt: -1 })
      .lean();
    return formatBanner(legacyBanner);
  }

  return formatBanner(banner);
};

const normalizePayload = async (body, { isUpdate = false } = {}) => {
  const pageType = normalizePageType(body.pageType || body.pageName);
  const payload = {
    pageType,
    badgeText: body.badgeText?.trim() ?? '',
    title: (body.title || body.mainHeading)?.trim(),
    highlightedTitle: (body.highlightedTitle || body.highlightText)?.trim() ?? '',
    description: body.description?.trim() ?? '',
    buttonText: (body.buttonText || body.button1Text)?.trim() ?? '',
    buttonUrl: (body.buttonUrl || body.button1Url)?.trim() ?? '',
    sideCardTitle: body.sideCardTitle?.trim() ?? '',
    sideCardDescription: body.sideCardDescription?.trim() ?? '',
    sideCardIcon: body.sideCardIcon?.trim() ?? '',
    overlayColor: body.overlayColor?.trim() || '#0f172a',
    overlayOpacity:
      body.overlayOpacity !== undefined && body.overlayOpacity !== ''
        ? Number(body.overlayOpacity)
        : 0.55,
    displayOrder:
      body.displayOrder !== undefined && body.displayOrder !== ''
        ? Number(body.displayOrder)
        : 0,
    isActive:
      body.isActive !== undefined
        ? body.isActive === true || body.isActive === 'true'
        : true,
  };

  const imageValue = body.backgroundImage ?? body.image;
  if (imageValue !== undefined) {
    payload.backgroundImage = await resolveImage(imageValue);
  }

  if (!isUpdate) {
    if (!payload.pageType || !BANNER_PAGE_TYPES.includes(payload.pageType)) {
      const error = new Error('Valid page type is required');
      error.statusCode = 400;
      throw error;
    }
    if (!payload.title) {
      const error = new Error('Title is required');
      error.statusCode = 400;
      throw error;
    }
    if (!payload.backgroundImage) {
      const error = new Error('Banner image is required');
      error.statusCode = 400;
      throw error;
    }
  }

  if (payload.overlayOpacity < 0 || payload.overlayOpacity > 1 || Number.isNaN(payload.overlayOpacity)) {
    const error = new Error('Overlay opacity must be between 0 and 1');
    error.statusCode = 400;
    throw error;
  }

  return payload;
};

export const createBanner = async (body, user) => {
  const payload = await normalizePayload(body);
  const banner = await Banner.create({
    ...payload,
    createdBy: user?._id || user?.id || null,
    updatedBy: user?._id || user?.id || null,
  });

  await logManagerActivity({
    user,
    action: 'create',
    module: 'banners',
    description: `Created banner for ${banner.pageType}`,
    metadata: { bannerId: banner._id, pageType: banner.pageType },
  });

  return formatBanner(banner);
};

export const updateBanner = async (id, body, user) => {
  const banner = await Banner.findOne({ _id: id, ...notDeleted });
  if (!banner) {
    const error = new Error('Banner not found');
    error.statusCode = 404;
    throw error;
  }

  const payload = await normalizePayload(body, { isUpdate: true });
  Object.keys(payload).forEach((key) => {
    if (payload[key] !== undefined) {
      banner[key] = payload[key];
    }
  });
  banner.updatedBy = user?._id || user?.id || null;
  await banner.save();

  await logManagerActivity({
    user,
    action: 'update',
    module: 'banners',
    description: `Updated banner for ${banner.pageType}`,
    metadata: { bannerId: banner._id, pageType: banner.pageType },
  });

  return formatBanner(banner);
};

export const updateBannerStatus = async (id, isActive, user) => {
  const banner = await Banner.findOne({ _id: id, ...notDeleted });
  if (!banner) {
    const error = new Error('Banner not found');
    error.statusCode = 404;
    throw error;
  }

  banner.isActive = Boolean(isActive);
  banner.updatedBy = user?._id || user?.id || null;
  await banner.save();

  await logManagerActivity({
    user,
    action: 'update',
    module: 'banners',
    description: `${banner.isActive ? 'Activated' : 'Deactivated'} banner for ${banner.pageType}`,
    metadata: { bannerId: banner._id, pageType: banner.pageType, isActive: banner.isActive },
  });

  return formatBanner(banner);
};

export const softDeleteBanner = async (id, user) => {
  const banner = await Banner.findOne({ _id: id, ...notDeleted });
  if (!banner) {
    const error = new Error('Banner not found');
    error.statusCode = 404;
    throw error;
  }

  banner.deletedAt = new Date();
  banner.isActive = false;
  banner.updatedBy = user?._id || user?.id || null;
  await banner.save();

  await logManagerActivity({
    user,
    action: 'delete',
    module: 'banners',
    description: `Deleted banner for ${banner.pageType}`,
    metadata: { bannerId: banner._id, pageType: banner.pageType },
  });

  return true;
};

export const getPageTypeOptions = () => BANNER_PAGE_TYPES;
