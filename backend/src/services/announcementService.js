import Announcement from '../models/Announcement.js';
import { handleBase64Upload } from '../middlewares/uploadMiddleware.js';
import { logManagerActivity } from './activityLogService.js';

const startOfDay = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const endOfDay = (date) => {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
};

export const resolveAnnouncementStatus = (announcement, now = new Date()) => {
  const storedStatus = announcement.status;
  if (storedStatus === 'deleted') return 'deleted';
  if (storedStatus === 'inactive') return 'inactive';
  if (storedStatus === 'draft') return 'draft';
  if (announcement.isExpired || storedStatus === 'expired') return 'expired';

  const start = startOfDay(announcement.startDate);
  const end = endOfDay(announcement.endDate);

  if (now > end) return 'expired';
  if (storedStatus === 'scheduled' && now < start) return 'scheduled';
  if (now < start && storedStatus !== 'active') return storedStatus || 'draft';

  return storedStatus === 'scheduled' ? 'active' : storedStatus || 'active';
};

export const formatAnnouncement = (doc, now = new Date()) => {
  if (!doc) return null;
  const plain = doc.toObject ? doc.toObject() : { ...doc };
  const effectiveStatus = resolveAnnouncementStatus(plain, now);

  return {
    ...plain,
    id: plain._id?.toString?.() ?? plain.id,
    discountPercentage: plain.discountPercentage ?? plain.offerPercentage ?? 0,
    bannerImage: plain.bannerImage || plain.image || '',
    offerPercentage: plain.discountPercentage ?? plain.offerPercentage ?? 0,
    image: plain.bannerImage || plain.image || '',
    effectiveStatus,
    startDate: plain.startDate ? new Date(plain.startDate).toISOString().split('T')[0] : null,
    endDate: plain.endDate ? new Date(plain.endDate).toISOString().split('T')[0] : null,
  };
};

export const formatStorefrontAnnouncement = (doc, now = new Date()) => {
  const formatted = formatAnnouncement(doc, now);
  return {
    title: formatted.title,
    description: formatted.description,
    discountPercentage: formatted.discountPercentage,
    bannerImage: formatted.bannerImage,
    startDate: formatted.startDate,
    endDate: formatted.endDate,
  };
};

const parsePagination = (query = {}) => {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

export const buildAnnouncementFilter = (query = {}, { includeDeleted = false } = {}) => {
  const filter = {};

  if (!includeDeleted) {
    filter.status = { $ne: 'deleted' };
  }

  if (query.status && query.status !== 'all') {
    if (query.status === 'expired') {
      filter.$or = [{ status: 'expired' }, { isExpired: true }];
    } else if (query.status === 'draft') {
      filter.status = { $in: ['draft', 'scheduled'] };
    } else {
      filter.status = query.status;
    }
  }

  const searchTerm = query.search || query.q;
  if (searchTerm) {
    const regex = new RegExp(
      String(searchTerm).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
      'i'
    );
    filter.$and = filter.$and || [];
    filter.$and.push({
      $or: [{ title: regex }, { description: regex }],
    });
  }

  if (query.date) {
    const dayStart = startOfDay(query.date);
    const dayEnd = endOfDay(query.date);
    filter.startDate = { $lte: dayEnd };
    filter.endDate = { $gte: dayStart };
  }

  return filter;
};

const resolveImage = async (value) => {
  if (!value) return '';
  if (typeof value === 'string' && value.startsWith('data:image')) {
    return (await handleBase64Upload(value)) || value;
  }
  return value;
};

const validatePublish = (endDate, now = new Date()) => {
  if (now > endOfDay(endDate)) {
    const error = new Error('Cannot publish: end date has already passed');
    error.statusCode = 400;
    throw error;
  }
};

const normalizePayload = async (body, { isUpdate = false, existing = null } = {}) => {
  const title = (body.title ?? existing?.title ?? '').trim();
  const description = (body.description ?? existing?.description ?? '').trim();

  if (!isUpdate || body.title !== undefined) {
    if (!title || title.length < 3 || title.length > 150) {
      const error = new Error('Title must be between 3 and 150 characters');
      error.statusCode = 400;
      throw error;
    }
  }

  if (!isUpdate || body.description !== undefined) {
    if (!description || description.length < 10) {
      const error = new Error('Description must be at least 10 characters');
      error.statusCode = 400;
      throw error;
    }
    if (description.length > 2000) {
      const error = new Error('Description must not exceed 2000 characters');
      error.statusCode = 400;
      throw error;
    }
  }

  const discountPercentage = Number(
    body.discountPercentage ?? body.offerPercentage ?? existing?.discountPercentage ?? 0
  );
  if (discountPercentage < 0 || discountPercentage > 100) {
    const error = new Error('Discount percentage must be between 0 and 100');
    error.statusCode = 400;
    throw error;
  }

  const startDate = body.startDate ? new Date(body.startDate) : existing?.startDate ?? null;
  const endDate = body.endDate ? new Date(body.endDate) : existing?.endDate ?? null;

  if (!isUpdate) {
    if (!startDate || Number.isNaN(startDate.getTime())) {
      const error = new Error('Start date is required');
      error.statusCode = 400;
      throw error;
    }
    if (!endDate || Number.isNaN(endDate.getTime())) {
      const error = new Error('End date is required');
      error.statusCode = 400;
      throw error;
    }
    if (!body.status) {
      const error = new Error('Status is required');
      error.statusCode = 400;
      throw error;
    }
  }

  if (startDate && endDate && endDate <= startDate) {
    const error = new Error('End date must be greater than start date');
    error.statusCode = 400;
    throw error;
  }

  const requestedStatus = body.status ?? existing?.status;
  if (requestedStatus === 'active' && endDate) {
    validatePublish(endDate);
  }

  const bannerInput = body.bannerImage ?? body.image;
  const payload = {};
  if (body.title !== undefined || !isUpdate) payload.title = title;
  if (body.description !== undefined || !isUpdate) payload.description = description;
  if (body.discountPercentage !== undefined || body.offerPercentage !== undefined || !isUpdate) {
    payload.discountPercentage = discountPercentage;
  }
  if (startDate) payload.startDate = startDate;
  if (endDate) payload.endDate = endDate;

  if (bannerInput !== undefined) {
    payload.bannerImage = await resolveImage(bannerInput);
  }

  if (body.status !== undefined) {
    payload.status = body.status === 'scheduled' ? 'draft' : body.status;
  }

  const now = new Date();
  if (!isUpdate && startDate && endDate && payload.status === 'active') {
    if (now > endOfDay(endDate)) {
      payload.status = 'expired';
      payload.isExpired = true;
    } else {
      payload.isExpired = false;
    }
  }

  return payload;
};

export const listAnnouncements = async (query = {}) => {
  const { page, limit, skip } = parsePagination(query);
  const filter = buildAnnouncementFilter(query);
  const now = new Date();

  const [items, total] = await Promise.all([
    Announcement.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Announcement.countDocuments(filter),
  ]);

  let data = items.map((item) => formatAnnouncement(item, now));

  if (query.status && ['active', 'scheduled', 'expired', 'draft'].includes(query.status)) {
    data = data.filter((item) => {
      if (query.status === 'draft') {
        return item.effectiveStatus === 'draft' || item.effectiveStatus === 'scheduled';
      }
      return item.effectiveStatus === query.status;
    });
  }

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit) || 1,
    },
  };
};

export const searchAnnouncements = async (query) =>
  listAnnouncements({ q: query, limit: 100 });

export const getStorefrontAnnouncements = async () => {
  const now = new Date();
  const items = await Announcement.find({
    status: 'active',
    isExpired: { $ne: true },
    startDate: { $lte: endOfDay(now) },
    endDate: { $gte: startOfDay(now) },
  }).sort({ createdAt: -1 });

  return items
    .map((item) => formatAnnouncement(item, now))
    .filter((item) => item.effectiveStatus === 'active')
    .map(formatStorefrontAnnouncement);
};

export const getPublicAnnouncements = async () => getStorefrontAnnouncements();

export const getAnnouncementById = async (id) => {
  const announcement = await Announcement.findOne({ _id: id, status: { $ne: 'deleted' } });
  if (!announcement) {
    const error = new Error('Announcement not found');
    error.statusCode = 404;
    throw error;
  }
  return formatAnnouncement(announcement);
};

export const createAnnouncement = async (body, user) => {
  const payload = await normalizePayload(body);
  payload.createdBy = user?._id || null;
  payload.updatedBy = user?._id || null;

  const announcement = await Announcement.create(payload);

  await logManagerActivity({
    user,
    action: 'CREATE',
    module: 'ANNOUNCEMENT',
    description: 'Announcement created',
  });

  if (announcement.status === 'active') {
    await logManagerActivity({
      user,
      action: 'PUBLISH',
      module: 'ANNOUNCEMENT',
      description: 'Announcement published',
    });
  }

  return formatAnnouncement(announcement);
};

export const updateAnnouncement = async (id, body, user) => {
  const announcement = await Announcement.findOne({ _id: id, status: { $ne: 'deleted' } });
  if (!announcement) {
    const error = new Error('Announcement not found');
    error.statusCode = 404;
    throw error;
  }

  const previousStatus = announcement.status;
  const payload = await normalizePayload(body, { isUpdate: true, existing: announcement });
  Object.assign(announcement, payload);
  announcement.updatedBy = user?._id || null;

  if (body.status === 'active') {
    validatePublish(announcement.endDate);
    const now = new Date();
    if (now > endOfDay(announcement.endDate)) {
      announcement.status = 'expired';
      announcement.isExpired = true;
    } else {
      announcement.status = 'active';
      announcement.isExpired = false;
    }
  }

  await announcement.save();

  const published = previousStatus !== 'active' && announcement.status === 'active';
  const statusChanged = previousStatus !== announcement.status;

  if (published) {
    await logManagerActivity({
      user,
      action: 'PUBLISH',
      module: 'ANNOUNCEMENT',
      description: 'Announcement published',
    });
  } else if (statusChanged) {
    await logManagerActivity({
      user,
      action: 'STATUS_CHANGE',
      module: 'ANNOUNCEMENT',
      description: 'Announcement status changed',
    });
  } else {
    await logManagerActivity({
      user,
      action: 'UPDATE',
      module: 'ANNOUNCEMENT',
      description: 'Announcement updated',
    });
  }

  return formatAnnouncement(announcement);
};

export const softDeleteAnnouncement = async (id, user) => {
  const announcement = await Announcement.findOne({ _id: id, status: { $ne: 'deleted' } });
  if (!announcement) {
    const error = new Error('Announcement not found');
    error.statusCode = 404;
    throw error;
  }

  announcement.status = 'deleted';
  announcement.updatedBy = user?._id || null;
  await announcement.save();

  await logManagerActivity({
    user,
    action: 'DELETE',
    module: 'ANNOUNCEMENT',
    description: 'Announcement deleted',
  });

  return { success: true };
};

export const expireAnnouncements = async () => {
  const now = new Date();
  const toExpire = await Announcement.find({
    status: { $nin: ['deleted', 'inactive', 'expired', 'draft'] },
    endDate: { $lt: startOfDay(now) },
    isExpired: { $ne: true },
  });

  if (!toExpire.length) return 0;

  await Announcement.updateMany(
    { _id: { $in: toExpire.map((item) => item._id) } },
    { $set: { status: 'expired', isExpired: true } }
  );

  await Promise.all(
    toExpire.map(() =>
      logManagerActivity({
        action: 'EXPIRE',
        module: 'ANNOUNCEMENT',
        description: 'Announcement expired automatically',
      })
    )
  );

  return toExpire.length;
};

export const countActiveAnnouncements = async () =>
  Announcement.countDocuments({ status: 'active', isExpired: { $ne: true } });
