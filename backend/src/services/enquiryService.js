import CustomerEnquiry from '../models/CustomerEnquiry.js';
import { sanitizeEnquiryInput } from '../utils/sanitize.js';
import { buildWhatsAppLink, sendEnquiryReplyEmail, truncate } from './emailService.js';
import { createEnquiryNotification, markEnquiryNotificationsRead } from './notificationService.js';
import { logActivity } from './activityLogService.js';
import {
  ENQUIRY_PUBLIC_STATUSES,
  normalizeEnquiryStatus,
  statusMatchesFilter,
} from '../constants/enquiryStatuses.js';

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

const syncReadFlag = (enquiry, status) => {
  enquiry.isRead = status !== 'New';
};

export const formatEnquiry = (doc) => {
  if (!doc) return null;
  const plain = doc.toObject ? doc.toObject() : { ...doc };
  const status = normalizeEnquiryStatus(plain.status);

  return {
    ...plain,
    id: plain._id?.toString?.() ?? plain.id,
    name: plain.senderName,
    senderName: plain.senderName,
    status,
    date: plain.createdAt,
    messagePreview: truncate(plain.message, 120),
    whatsappLink: buildWhatsAppLink(plain.phone),
    source: plain.source || 'website',
    effectiveStatus: plain.status === 'deleted' ? 'deleted' : status,
  };
};

const parsePagination = (query = {}) => {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

export const buildEnquiryFilter = (query = {}) => {
  const filter = { status: { $ne: 'deleted' } };

  if (query.status && query.status !== 'all') {
    filter.status = { $in: statusMatchesFilter(query.status) };
  }

  if (query.enquiryType && query.enquiryType !== 'all') {
    filter.enquiryType = query.enquiryType;
  }

  if (query.search) {
    const regex = new RegExp(
      String(query.search).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
      'i'
    );
    filter.$or = [
      { senderName: regex },
      { email: regex },
      { phone: regex },
      { subject: regex },
      { message: regex },
      { productName: regex },
    ];
  }

  if (query.date) {
    const dayStart = startOfDay(query.date);
    const dayEnd = endOfDay(query.date);
    filter.createdAt = { $gte: dayStart, $lte: dayEnd };
  }

  return filter;
};

const validateEnquiryPayload = (sanitized, enquiryType) => {
  if (!sanitized.senderName || sanitized.senderName.length < 3) {
    const error = new Error('Name must be at least 3 characters');
    error.statusCode = 400;
    throw error;
  }
  if (!sanitized.email) {
    const error = new Error('Email is required');
    error.statusCode = 400;
    throw error;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sanitized.email)) {
    const error = new Error('Please provide a valid email address');
    error.statusCode = 400;
    throw error;
  }
  if (!sanitized.phone) {
    const error = new Error('Phone is required');
    error.statusCode = 400;
    throw error;
  }
  if (!sanitized.message) {
    const error = new Error('Message is required');
    error.statusCode = 400;
    throw error;
  }

  if (enquiryType === 'contact-us' && !sanitized.subject) {
    const error = new Error('Subject is required');
    error.statusCode = 400;
    throw error;
  }

  if (['product-enquiry', 'food-corner-enquiry'].includes(enquiryType) && !sanitized.productName) {
    const error = new Error('Product name is required');
    error.statusCode = 400;
    throw error;
  }
};

const buildSubject = (enquiryType, sanitized) => {
  if (sanitized.subject) return sanitized.subject;
  if (enquiryType === 'product-enquiry') {
    return `Product Enquiry: ${sanitized.productName}`;
  }
  if (enquiryType === 'food-corner-enquiry') {
    return `Food Corner Enquiry: ${sanitized.productName}`;
  }
  return 'Customer Enquiry';
};

export const createEnquiry = async (body, enquiryType) => {
  const sanitized = sanitizeEnquiryInput(body);
  validateEnquiryPayload(sanitized, enquiryType);

  const enquiry = await CustomerEnquiry.create({
    enquiryType,
    senderName: sanitized.senderName,
    email: sanitized.email,
    phone: sanitized.phone,
    subject: buildSubject(enquiryType, sanitized),
    message: sanitized.message,
    productName: sanitized.productName || '',
    quantityRequired: sanitized.quantityRequired || '',
    attachment: sanitized.attachment || '',
    source: sanitized.source || 'website',
    status: 'New',
    isRead: false,
  });

  await createEnquiryNotification(enquiry);
  await logActivity({
    action: 'CREATE',
    module: 'ENQUIRY',
    description: 'New customer enquiry received',
  });

  return formatEnquiry(enquiry);
};

export const listEnquiries = async (query = {}) => {
  const { page, limit, skip } = parsePagination(query);
  const filter = buildEnquiryFilter(query);

  const [items, total] = await Promise.all([
    CustomerEnquiry.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    CustomerEnquiry.countDocuments(filter),
  ]);

  return {
    data: items.map(formatEnquiry),
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit) || 1,
    },
  };
};

export const getEnquiryById = async (id) => {
  const enquiry = await CustomerEnquiry.findOne({ _id: id, status: { $ne: 'deleted' } });
  if (!enquiry) {
    const error = new Error('Enquiry not found');
    error.statusCode = 404;
    throw error;
  }
  return formatEnquiry(enquiry);
};

export const updateEnquiryStatus = async (id, statusInput, user) => {
  const status = normalizeEnquiryStatus(statusInput);

  if (!ENQUIRY_PUBLIC_STATUSES.includes(status)) {
    const error = new Error('Invalid enquiry status');
    error.statusCode = 400;
    throw error;
  }

  const enquiry = await CustomerEnquiry.findOne({ _id: id, status: { $ne: 'deleted' } });
  if (!enquiry) {
    const error = new Error('Enquiry not found');
    error.statusCode = 404;
    throw error;
  }

  enquiry.status = status;
  syncReadFlag(enquiry, status);

  if (status === 'Replied') {
    enquiry.repliedAt = new Date();
    enquiry.repliedBy = user?._id || null;
  }

  if (status === 'Read') {
    await markEnquiryNotificationsRead(enquiry._id);
  }

  await enquiry.save();

  await logActivity({
    user,
    action: 'UPDATE',
    module: 'ENQUIRY',
    description: `Enquiry status changed to ${status}`,
  });

  return formatEnquiry(enquiry);
};

export const markEnquiryRead = async (id, user) =>
  updateEnquiryStatus(id, 'Read', user);

export const markEnquiryReplied = async (id, user) =>
  updateEnquiryStatus(id, 'Replied', user);

export const closeEnquiry = async (id, user) =>
  updateEnquiryStatus(id, 'Closed', user);

export const replyToEnquiry = async (id, replyMessage, user) => {
  const enquiry = await CustomerEnquiry.findOne({ _id: id, status: { $ne: 'deleted' } });
  if (!enquiry) {
    const error = new Error('Enquiry not found');
    error.statusCode = 404;
    throw error;
  }

  const sanitizedReply = String(replyMessage || '').trim();
  if (!sanitizedReply) {
    const error = new Error('Reply message is required');
    error.statusCode = 400;
    throw error;
  }

  await sendEnquiryReplyEmail({
    to: enquiry.email,
    customerName: enquiry.senderName,
    subject: enquiry.subject,
    replyMessage: sanitizedReply,
  });

  enquiry.replyLogs.push({
    replyMessage: sanitizedReply,
    repliedBy: user?._id || null,
    repliedAt: new Date(),
  });
  enquiry.status = 'Replied';
  enquiry.isRead = true;
  enquiry.repliedAt = new Date();
  enquiry.repliedBy = user?._id || null;
  await enquiry.save();

  await logActivity({
    user,
    action: 'REPLY',
    module: 'ENQUIRY',
    description: 'Admin replied to enquiry',
  });

  return formatEnquiry(enquiry);
};

export const softDeleteEnquiry = async (id, user) => {
  const enquiry = await CustomerEnquiry.findOne({ _id: id, status: { $ne: 'deleted' } });
  if (!enquiry) {
    const error = new Error('Enquiry not found');
    error.statusCode = 404;
    throw error;
  }

  enquiry.status = 'deleted';
  await enquiry.save();

  await logActivity({
    user,
    action: 'DELETE',
    module: 'ENQUIRY',
    description: 'Enquiry deleted',
  });

  return { success: true };
};

export const getEnquiryStats = async () => {
  const baseFilter = { status: { $ne: 'deleted' } };
  const [totalEnquiries, newEnquiries, readEnquiries, repliedEnquiries, closedEnquiries] =
    await Promise.all([
      CustomerEnquiry.countDocuments(baseFilter),
      CustomerEnquiry.countDocuments({ ...baseFilter, status: { $in: statusMatchesFilter('New') } }),
      CustomerEnquiry.countDocuments({ status: { $in: statusMatchesFilter('Read') } }),
      CustomerEnquiry.countDocuments({ status: { $in: statusMatchesFilter('Replied') } }),
      CustomerEnquiry.countDocuments({ status: { $in: statusMatchesFilter('Closed') } }),
    ]);

  return {
    totalEnquiries,
    newEnquiries,
    readEnquiries,
    repliedEnquiries,
    closedEnquiries,
  };
};

export const getUnreadEnquiryCount = async () =>
  CustomerEnquiry.countDocuments({ status: { $in: statusMatchesFilter('New') } });
