import FAQ from '../models/FAQ.js';

/** Leading number in question text (e.g. "1. Who..." → 1), or null. */
export const extractFaqLeadingNumber = (question) => {
  const match = String(question || '').trim().match(/^(\d+)/);
  return match ? parseInt(match[1], 10) : null;
};

/**
 * Sort FAQs for display: lowest order first, then oldest created first.
 */
export const sortFaqsByDisplayOrder = (faqs) =>
  [...faqs].sort((a, b) => {
    const orderA = a.order ?? 0;
    const orderB = b.order ?? 0;
    if (orderA !== orderB) return orderA - orderB;
    return new Date(a.createdAt) - new Date(b.createdAt);
  });

/**
 * Re-assign order 1..n by createdAt (first added = order 1).
 */
export const normalizeFaqOrdersByCreatedAt = async () => {
  const faqs = await FAQ.find().sort({ createdAt: 1 });
  if (!faqs.length) return [];

  await Promise.all(
    faqs.map((faq, index) => {
      const nextOrder = index + 1;
      if (faq.order === nextOrder) return Promise.resolve();
      faq.order = nextOrder;
      return faq.save();
    })
  );

  return faqs.map((faq, index) => {
    faq.order = index + 1;
    return faq;
  });
};

/**
 * When every FAQ has a leading number in the question, order by that (1 before 9).
 */
export const normalizeFaqOrdersByLeadingNumber = async () => {
  const faqs = await FAQ.find();
  if (!faqs.length) return [];

  const withKeys = faqs.map((faq) => ({
    faq,
    leading: extractFaqLeadingNumber(faq.question),
  }));

  const allHaveLeading = withKeys.every((item) => item.leading !== null);
  if (!allHaveLeading) return null;

  withKeys.sort((a, b) => {
    if (a.leading !== b.leading) return a.leading - b.leading;
    return new Date(a.faq.createdAt) - new Date(b.faq.createdAt);
  });

  await Promise.all(
    withKeys.map((item, index) => {
      const nextOrder = index + 1;
      if (item.faq.order === nextOrder) return Promise.resolve();
      item.faq.order = nextOrder;
      return item.faq.save();
    })
  );

  return withKeys.map((item, index) => {
    item.faq.order = index + 1;
    return item.faq;
  });
};

/**
 * Returns FAQs in correct display order, fixing legacy data when needed.
 */
export const getFaqsInDisplayOrder = async (filter = {}) => {
  let faqs = await FAQ.find(filter).sort({ order: 1, createdAt: 1 });

  if (faqs.length <= 1) return faqs;

  const allZero = faqs.every((f) => !f.order || f.order === 0);
  const orders = faqs.map((f) => f.order);
  const hasDuplicateOrders = new Set(orders).size !== orders.length;

  if (allZero || hasDuplicateOrders) {
    const byNumber = await normalizeFaqOrdersByLeadingNumber();
    const normalized = byNumber || (await normalizeFaqOrdersByCreatedAt());
    if (filter.status) {
      return normalized.filter((f) => f.status === filter.status);
    }
    return normalized;
  }

  return sortFaqsByDisplayOrder(faqs);
};

export const getNextFaqOrder = async () => {
  const latest = await FAQ.findOne().sort({ order: -1 }).select('order');
  return (latest?.order || 0) + 1;
};

export const renumberFaqsAfterDelete = async () => {
  const byNumber = await normalizeFaqOrdersByLeadingNumber();
  if (!byNumber) {
    await normalizeFaqOrdersByCreatedAt();
  }
};
