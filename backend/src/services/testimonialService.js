import Testimonial, { DEFAULT_AVATAR } from '../models/Testimonial.js';
import { handleBase64Upload } from '../middlewares/uploadMiddleware.js';
import { logManagerActivity } from './activityLogService.js';

const notDeletedFilter = { status: { $ne: 'deleted' } };

const resolveAvatar = (value) => {
  if (!value || !String(value).trim()) return DEFAULT_AVATAR;
  return value;
};

export const formatTestimonial = (doc) => {
  if (!doc) return null;
  const plain = doc.toObject ? doc.toObject() : { ...doc };
  const avatarImage = resolveAvatar(plain.avatarImage || plain.image);

  return {
    ...plain,
    id: plain._id?.toString?.() ?? plain.id,
    avatarImage,
    image: avatarImage,
  };
};

export const formatStorefrontTestimonial = (doc) => {
  const formatted = formatTestimonial(doc);
  return {
    customerName: formatted.customerName,
    rating: formatted.rating,
    review: formatted.review,
    avatarImage: formatted.avatarImage,
    image: formatted.avatarImage,
  };
};

const mapIncomingFields = (body = {}) => ({
  customerName: body.customerName,
  rating: body.rating !== undefined ? Number(body.rating) : undefined,
  review: body.review,
  avatarImage: body.avatarImage ?? body.image,
  status: body.status,
});

const validatePayload = (fields, { isUpdate = false } = {}) => {
  const name = (fields.customerName || '').trim();
  const review = (fields.review || '').trim();
  const rating = fields.rating;

  if (!isUpdate || fields.customerName !== undefined) {
    if (!name || name.length < 2) {
      const error = new Error('Customer name must be at least 2 characters');
      error.statusCode = 400;
      throw error;
    }
    if (name.length > 100) {
      const error = new Error('Customer name must not exceed 100 characters');
      error.statusCode = 400;
      throw error;
    }
  }

  if (!isUpdate || fields.rating !== undefined) {
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      const error = new Error('Rating must be an integer between 1 and 5');
      error.statusCode = 400;
      throw error;
    }
  }

  if (!isUpdate || fields.review !== undefined) {
    if (!review || review.length < 20) {
      const error = new Error('Review must be at least 20 characters');
      error.statusCode = 400;
      throw error;
    }
    if (review.length > 1000) {
      const error = new Error('Review must not exceed 1000 characters');
      error.statusCode = 400;
      throw error;
    }
  }

  if (!isUpdate && !fields.status) {
    const error = new Error('Status is required');
    error.statusCode = 400;
    throw error;
  }
};

const resolveImage = async (value) => {
  if (!value) return '';
  if (typeof value === 'string' && value.startsWith('data:image')) {
    return (await handleBase64Upload(value)) || value;
  }
  return value;
};

const buildPayload = async (body, { isUpdate = false, existing = null } = {}) => {
  const fields = mapIncomingFields(body);
  validatePayload(
    {
      customerName: fields.customerName ?? existing?.customerName,
      rating: fields.rating ?? existing?.rating,
      review: fields.review ?? existing?.review,
      status: fields.status ?? existing?.status,
    },
    { isUpdate }
  );

  const payload = {};
  if (fields.customerName !== undefined) payload.customerName = fields.customerName.trim();
  if (fields.rating !== undefined) payload.rating = fields.rating;
  if (fields.review !== undefined) payload.review = fields.review.trim();
  if (fields.status !== undefined) payload.status = fields.status;

  if (fields.avatarImage !== undefined) {
    const resolved = await resolveImage(fields.avatarImage);
    payload.avatarImage = resolved || '';
    payload.image = payload.avatarImage;
  }

  return payload;
};

export const listTestimonials = async ({ search } = {}) => {
  const filter = { ...notDeletedFilter };

  if (search) {
    const regex = new RegExp(
      String(search).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
      'i'
    );
    filter.$or = [{ customerName: regex }, { review: regex }];
  }

  const items = await Testimonial.find(filter).sort({ createdAt: -1 });
  return items.map(formatTestimonial);
};

export const getStorefrontTestimonials = async () => {
  const items = await Testimonial.find({ status: 'active' }).sort({ createdAt: -1 });
  return items.map(formatStorefrontTestimonial);
};

export const getTestimonialById = async (id) => {
  const testimonial = await Testimonial.findOne({ _id: id, ...notDeletedFilter });
  if (!testimonial) {
    const error = new Error('Testimonial not found');
    error.statusCode = 404;
    throw error;
  }
  return formatTestimonial(testimonial);
};

export const createTestimonial = async (body, user) => {
  const payload = await buildPayload(body);
  payload.createdBy = user?._id || null;
  payload.updatedBy = user?._id || null;

  const testimonial = await Testimonial.create(payload);

  await logManagerActivity({
    user,
    action: 'CREATE',
    module: 'TESTIMONIAL',
    description: 'New testimonial created',
  });

  return formatTestimonial(testimonial);
};

export const updateTestimonial = async (id, body, user) => {
  const testimonial = await Testimonial.findOne({ _id: id, ...notDeletedFilter });
  if (!testimonial) {
    const error = new Error('Testimonial not found');
    error.statusCode = 404;
    throw error;
  }

  const previousStatus = testimonial.status;
  const payload = await buildPayload(body, { isUpdate: true, existing: testimonial });
  Object.assign(testimonial, payload);
  testimonial.updatedBy = user?._id || null;
  await testimonial.save();

  await logManagerActivity({
    user,
    action: previousStatus !== testimonial.status ? 'STATUS_CHANGE' : 'UPDATE',
    module: 'TESTIMONIAL',
    description:
      previousStatus !== testimonial.status
        ? 'Testimonial status changed'
        : 'Testimonial updated',
  });

  return formatTestimonial(testimonial);
};

export const softDeleteTestimonial = async (id, user) => {
  const testimonial = await Testimonial.findOne({ _id: id, ...notDeletedFilter });
  if (!testimonial) {
    const error = new Error('Testimonial not found');
    error.statusCode = 404;
    throw error;
  }

  testimonial.status = 'deleted';
  testimonial.updatedBy = user?._id || null;
  await testimonial.save();

  await logManagerActivity({
    user,
    action: 'DELETE',
    module: 'TESTIMONIAL',
    description: 'Testimonial deleted',
  });

  return { success: true };
};

export const searchTestimonials = async (query) => listTestimonials({ search: query });

export const countActiveTestimonials = async () =>
  Testimonial.countDocuments({ status: 'active' });
