import Banner, { BANNER_PAGE_NAMES } from '../models/Banner.js';
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

export const formatBanner = (doc) => {
  if (!doc) return null;
  const plain = doc.toObject ? doc.toObject() : { ...doc };
  return {
    ...plain,
    id: plain._id?.toString?.() ?? plain.id,
    isActive: Boolean(plain.isActive),
    overlayOpacity: Number(plain.overlayOpacity ?? 0.55),
    displayOrder: Number(plain.displayOrder ?? 0),
    // Legacy aliases for home hero
    headingLine1: plain.mainHeading,
    headingLine2: plain.highlightText,
    headingLine3: plain.badgeText,
    subtitle: plain.description,
    backgroundImage: plain.image,
    primaryButtonLabel: plain.button1Text,
    primaryButtonLink: plain.button1Url,
    secondaryButtonLabel: plain.button2Text,
    secondaryButtonLink: plain.button2Url,
  };
};

const buildListQuery = ({ pageName, q, includeInactive = true }) => {
  const query = { ...notDeleted };
  if (pageName && pageName !== 'all') {
    query.pageName = pageName;
  }
  if (!includeInactive) {
    query.isActive = true;
  }
  if (q?.trim()) {
    const term = q.trim();
    query.$or = [
      { mainHeading: { $regex: term, $options: 'i' } },
      { highlightText: { $regex: term, $options: 'i' } },
      { description: { $regex: term, $options: 'i' } },
      { pageName: { $regex: term, $options: 'i' } },
      { badgeText: { $regex: term, $options: 'i' } },
    ];
  }
  return query;
};

export const listBanners = async ({
  pageName,
  q,
  page = 1,
  limit = 10,
  includeInactive = true,
}) => {
  const safeLimit = Math.min(Math.max(Number(limit) || 10, 1), 100);
  const safePage = Math.max(Number(page) || 1, 1);
  const query = buildListQuery({ pageName, q, includeInactive });

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

export const getActiveBannerByPage = async (pageName) => {
  const normalized = String(pageName || '').trim().toLowerCase();
  if (!BANNER_PAGE_NAMES.includes(normalized)) {
    const error = new Error('Invalid page name');
    error.statusCode = 400;
    throw error;
  }

  const banner = await Banner.findOne({
    pageName: normalized,
    isActive: true,
    ...notDeleted,
  })
    .sort({ displayOrder: 1, updatedAt: -1 })
    .lean();

  return formatBanner(banner);
};

const normalizePayload = async (body, { isUpdate = false } = {}) => {
  const payload = {
    pageName: body.pageName?.trim().toLowerCase(),
    badgeText: body.badgeText?.trim() ?? '',
    mainHeading: body.mainHeading?.trim(),
    highlightText: body.highlightText?.trim() ?? '',
    description: body.description?.trim() ?? '',
    button1Text: body.button1Text?.trim() ?? '',
    button1Url: body.button1Url?.trim() ?? '',
    button2Text: body.button2Text?.trim() ?? '',
    button2Url: body.button2Url?.trim() ?? '',
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

  if (body.image !== undefined) {
    payload.image = await resolveImage(body.image);
  }

  if (!isUpdate) {
    if (!payload.pageName) {
      const error = new Error('Page name is required');
      error.statusCode = 400;
      throw error;
    }
    if (!payload.mainHeading) {
      const error = new Error('Main heading is required');
      error.statusCode = 400;
      throw error;
    }
    if (!payload.image) {
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
    description: `Created banner for ${banner.pageName}`,
    metadata: { bannerId: banner._id, pageName: banner.pageName },
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
    description: `Updated banner for ${banner.pageName}`,
    metadata: { bannerId: banner._id, pageName: banner.pageName },
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
    description: `Deleted banner for ${banner.pageName}`,
    metadata: { bannerId: banner._id, pageName: banner.pageName },
  });

  return true;
};

export const getPageNameOptions = () => BANNER_PAGE_NAMES;
