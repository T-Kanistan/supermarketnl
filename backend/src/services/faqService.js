import FAQ from '../models/FAQ.js';
import { logManagerActivity } from './activityLogService.js';
import { MAX_FAQ_COUNT, FAQ_LIMIT_ERROR_MESSAGE } from '../constants/faqLimits.js';

const notDeletedFilter = { status: { $ne: 'deleted' } };

export const stripLeadingNumberFromQuestion = (question) =>
  String(question || '')
    .trim()
    .replace(/^\d+\.\s*/, '');

const faqSortQuery = { displayOrder: 1, order: 1, createdAt: 1 };

export const formatFaq = (doc) => {
  if (!doc) return null;
  const plain = doc.toObject ? doc.toObject() : { ...doc };
  const displayOrder = plain.displayOrder ?? plain.order ?? 0;

  return {
    ...plain,
    id: plain._id?.toString?.() ?? plain.id,
    displayOrder,
    order: displayOrder,
  };
};

export const formatStorefrontFaq = (doc, index) => ({
  id: doc._id?.toString?.() ?? doc.id ?? String(index),
  question: stripLeadingNumberFromQuestion(doc.question),
  answer: doc.answer,
  displayOrder: doc.displayOrder ?? doc.order ?? index + 1,
  order: doc.displayOrder ?? doc.order ?? index + 1,
  number: index + 1,
});

const sortByDisplayOrder = (items) =>
  [...items].sort((a, b) => {
    const orderA = a.displayOrder ?? a.order ?? 0;
    const orderB = b.displayOrder ?? b.order ?? 0;
    if (orderA !== orderB) return orderA - orderB;
    return new Date(a.createdAt) - new Date(b.createdAt);
  });

export const getNextDisplayOrder = async () => {
  const latest = await FAQ.findOne(notDeletedFilter).sort({ displayOrder: -1 }).select('displayOrder order');
  const current = latest?.displayOrder ?? latest?.order ?? 0;
  return current + 1;
};

const normalizeQuestion = (question) => stripLeadingNumberFromQuestion(question).trim();

const validateFaqPayload = (fields, { isUpdate = false } = {}) => {
  const question = fields.question !== undefined ? normalizeQuestion(fields.question) : '';
  const answer = (fields.answer || '').trim();

  if (!isUpdate || fields.question !== undefined) {
    if (!question || question.length < 5) {
      const error = new Error('Question must be at least 5 characters');
      error.statusCode = 400;
      throw error;
    }
    if (question.length > 300) {
      const error = new Error('Question must not exceed 300 characters');
      error.statusCode = 400;
      throw error;
    }
  }

  if (!isUpdate || fields.answer !== undefined) {
    if (!answer || answer.length < 10) {
      const error = new Error('Answer must be at least 10 characters');
      error.statusCode = 400;
      throw error;
    }
    if (answer.length > 5000) {
      const error = new Error('Answer must not exceed 5000 characters');
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

const assertUniqueDisplayOrder = async (displayOrder, excludeId = null) => {
  const orderValue = Number(displayOrder);
  if (!Number.isInteger(orderValue) || orderValue < 1) {
    const error = new Error('Order must be a positive integer');
    error.statusCode = 400;
    throw error;
  }

  const filter = {
    ...notDeletedFilter,
    $or: [{ displayOrder: orderValue }, { order: orderValue }],
  };
  if (excludeId) {
    filter._id = { $ne: excludeId };
  }

  const conflict = await FAQ.findOne(filter);
  if (conflict) {
    const error = new Error(`Order ${orderValue} is already used by another FAQ`);
    error.statusCode = 400;
    throw error;
  }

  return orderValue;
};

export const listFaqs = async ({ includeDeleted = false, search } = {}) => {
  const filter = includeDeleted ? {} : { ...notDeletedFilter };

  if (search) {
    const regex = new RegExp(
      String(search).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
      'i'
    );
    filter.$or = [{ question: regex }, { answer: regex }];
  }

  const items = await FAQ.find(filter).sort(faqSortQuery);
  return sortByDisplayOrder(items).map(formatFaq);
};

export const getStorefrontFaqs = async () => {
  const items = await FAQ.find({ status: 'active' }).sort(faqSortQuery);
  return items.map((item, index) => formatStorefrontFaq(item, index));
};

export const getFaqById = async (id) => {
  const faq = await FAQ.findOne({ _id: id, ...notDeletedFilter });
  if (!faq) {
    const error = new Error('FAQ not found');
    error.statusCode = 404;
    throw error;
  }
  return formatFaq(faq);
};

export const countManageableFaqs = async () => FAQ.countDocuments(notDeletedFilter);

export const assertCanCreateFaq = async () => {
  const currentCount = await countManageableFaqs();
  if (currentCount >= MAX_FAQ_COUNT) {
    const error = new Error(FAQ_LIMIT_ERROR_MESSAGE);
    error.statusCode = 400;
    throw error;
  }
};

export const createFaq = async (body, user) => {
  await assertCanCreateFaq();
  validateFaqPayload(body);

  let displayOrder;
  if (body.displayOrder !== undefined || body.order !== undefined) {
    displayOrder = await assertUniqueDisplayOrder(body.displayOrder ?? body.order);
  } else {
    displayOrder = await getNextDisplayOrder();
  }

  const faq = await FAQ.create({
    question: normalizeQuestion(body.question),
    answer: body.answer.trim(),
    status: body.status || 'active',
    displayOrder,
    order: displayOrder,
    createdBy: user?._id || null,
    updatedBy: user?._id || null,
  });

  await logManagerActivity({
    user,
    action: 'CREATE',
    module: 'FAQ',
    description: 'FAQ created',
  });

  return formatFaq(faq);
};

export const updateFaq = async (id, body, user) => {
  const faq = await FAQ.findOne({ _id: id, ...notDeletedFilter });
  if (!faq) {
    const error = new Error('FAQ not found');
    error.statusCode = 404;
    throw error;
  }

  validateFaqPayload(
    {
      question: body.question ?? faq.question,
      answer: body.answer ?? faq.answer,
      status: body.status ?? faq.status,
    },
    { isUpdate: true }
  );

  if (body.question !== undefined) faq.question = normalizeQuestion(body.question);
  if (body.answer !== undefined) faq.answer = body.answer.trim();
  if (body.status !== undefined) faq.status = body.status;
  if (body.displayOrder !== undefined || body.order !== undefined) {
    const nextOrder = await assertUniqueDisplayOrder(body.displayOrder ?? body.order, faq._id);
    faq.displayOrder = nextOrder;
    faq.order = nextOrder;
  }
  faq.updatedBy = user?._id || null;

  await faq.save();

  await logManagerActivity({
    user,
    action: 'UPDATE',
    module: 'FAQ',
    description: 'FAQ updated',
  });

  return formatFaq(faq);
};

export const softDeleteFaq = async (id, user) => {
  const faq = await FAQ.findOne({ _id: id, ...notDeletedFilter });
  if (!faq) {
    const error = new Error('FAQ not found');
    error.statusCode = 404;
    throw error;
  }

  faq.status = 'deleted';
  faq.updatedBy = user?._id || null;
  await faq.save();

  await logManagerActivity({
    user,
    action: 'DELETE',
    module: 'FAQ',
    description: 'FAQ deleted',
  });

  return { success: true };
};

const getOrderedFaqs = async () => {
  const items = await FAQ.find(notDeletedFilter).sort(faqSortQuery);
  return sortByDisplayOrder(items);
};

const swapFaqOrder = async (faq, neighbor, user) => {
  const currentOrder = faq.displayOrder ?? faq.order ?? 0;
  const neighborOrder = neighbor.displayOrder ?? neighbor.order ?? 0;

  faq.displayOrder = neighborOrder;
  faq.order = neighborOrder;
  faq.updatedBy = user?._id || null;

  neighbor.displayOrder = currentOrder;
  neighbor.order = currentOrder;
  neighbor.updatedBy = user?._id || null;

  await Promise.all([faq.save(), neighbor.save()]);

  await logManagerActivity({
    user,
    action: 'REORDER',
    module: 'FAQ',
    description: 'FAQ order changed',
  });
};

export const moveFaqUp = async (id, user) => {
  const faqs = await getOrderedFaqs();
  const index = faqs.findIndex((item) => item._id.toString() === id);

  if (index === -1) {
    const error = new Error('FAQ not found');
    error.statusCode = 404;
    throw error;
  }
  if (index === 0) {
    const error = new Error('FAQ is already at the top');
    error.statusCode = 400;
    throw error;
  }

  await swapFaqOrder(faqs[index], faqs[index - 1], user);
  return listFaqs();
};

export const moveFaqDown = async (id, user) => {
  const faqs = await getOrderedFaqs();
  const index = faqs.findIndex((item) => item._id.toString() === id);

  if (index === -1) {
    const error = new Error('FAQ not found');
    error.statusCode = 404;
    throw error;
  }
  if (index === faqs.length - 1) {
    const error = new Error('FAQ is already at the bottom');
    error.statusCode = 400;
    throw error;
  }

  await swapFaqOrder(faqs[index], faqs[index + 1], user);
  return listFaqs();
};

export const saveFaqOrderValues = async (orders, user) => {
  if (!Array.isArray(orders) || !orders.length) {
    const error = new Error('orders array is required');
    error.statusCode = 400;
    throw error;
  }

  const normalized = orders.map((entry) => ({
    id: entry.faqId || entry.id,
    displayOrder: Number(entry.displayOrder ?? entry.order),
  }));

  const seen = new Set();
  for (const entry of normalized) {
    if (!entry.id) {
      const error = new Error('Each order entry must include a FAQ id');
      error.statusCode = 400;
      throw error;
    }
    if (!Number.isInteger(entry.displayOrder) || entry.displayOrder < 1) {
      const error = new Error('Each order value must be a positive integer');
      error.statusCode = 400;
      throw error;
    }
    if (seen.has(entry.displayOrder)) {
      const error = new Error('Order values must be unique');
      error.statusCode = 400;
      throw error;
    }
    seen.add(entry.displayOrder);
  }

  await Promise.all(
    normalized.map((entry) =>
      FAQ.findOneAndUpdate(
        { _id: entry.id, ...notDeletedFilter },
        { displayOrder: entry.displayOrder, order: entry.displayOrder, updatedBy: user?._id || null }
      )
    )
  );

  await logManagerActivity({
    user,
    action: 'REORDER',
    module: 'FAQ',
    description: 'FAQ order changed',
  });

  return listFaqs();
};

export const saveFaqOrder = async (faqIds, user) => {
  if (!Array.isArray(faqIds) || !faqIds.length) {
    const error = new Error('faqIds array is required');
    error.statusCode = 400;
    throw error;
  }

  await Promise.all(
    faqIds.map((faqId, index) =>
      FAQ.findOneAndUpdate(
        { _id: faqId, ...notDeletedFilter },
        { displayOrder: index + 1, order: index + 1, updatedBy: user?._id || null }
      )
    )
  );

  await logManagerActivity({
    user,
    action: 'REORDER',
    module: 'FAQ',
    description: 'FAQ order changed',
  });

  return listFaqs();
};

export const searchFaqs = async (query) => listFaqs({ search: query });

export const countActiveFaqs = async () => FAQ.countDocuments({ status: 'active' });

export const getFaqLimitMeta = async () => {
  const count = await countManageableFaqs();
  return {
    count,
    max: MAX_FAQ_COUNT,
    limitReached: count >= MAX_FAQ_COUNT,
  };
};

/** @deprecated Use saveFaqOrder — kept for normalize script */
export const extractFaqLeadingNumber = (question) => {
  const match = String(question || '').trim().match(/^(\d+)/);
  return match ? parseInt(match[1], 10) : null;
};

export const normalizeFaqOrdersByCreatedAt = async () => {
  const faqs = await FAQ.find(notDeletedFilter).sort({ createdAt: 1 });
  await Promise.all(
    faqs.map((faq, index) => {
      const nextOrder = index + 1;
      faq.displayOrder = nextOrder;
      faq.order = nextOrder;
      return faq.save();
    })
  );
  return faqs;
};

export const normalizeFaqOrdersByLeadingNumber = async () => {
  const faqs = await FAQ.find(notDeletedFilter);
  if (!faqs.length) return [];

  const withKeys = faqs.map((faq) => ({
    faq,
    leading: extractFaqLeadingNumber(faq.question),
  }));

  if (!withKeys.every((item) => item.leading !== null)) return null;

  withKeys.sort((a, b) => {
    if (a.leading !== b.leading) return a.leading - b.leading;
    return new Date(a.faq.createdAt) - new Date(b.faq.createdAt);
  });

  await Promise.all(
    withKeys.map((item, index) => {
      const nextOrder = index + 1;
      item.faq.displayOrder = nextOrder;
      item.faq.order = nextOrder;
      item.faq.question = normalizeQuestion(item.faq.question);
      return item.faq.save();
    })
  );

  return withKeys.map((item) => item.faq);
};
