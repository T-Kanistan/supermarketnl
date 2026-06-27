import LegalPageCMS, { getDefaultLegalPages } from '../models/LegalPageCMS.js';

const ensureLegalPages = async () => {
  let doc = await LegalPageCMS.findOne();
  if (!doc) {
    doc = await LegalPageCMS.create(getDefaultLegalPages());
  }
  return doc;
};

const mapDocToApi = (doc) => ({
  id: doc._id,
  terms: {
    title: doc.terms?.title || '',
    lastUpdated: doc.terms?.lastUpdated || '',
    sections: (doc.terms?.sections || []).map((s) => ({
      heading: s.heading || '',
      body: s.body || '',
    })),
  },
  privacy: {
    title: doc.privacy?.title || '',
    lastUpdated: doc.privacy?.lastUpdated || '',
    sections: (doc.privacy?.sections || []).map((s) => ({
      heading: s.heading || '',
      body: s.body || '',
    })),
  },
  updatedAt: doc.updatedAt,
});

const normalizePage = (page) => {
  if (!page || typeof page !== 'object') return undefined;
  const normalized = {};
  if (page.title !== undefined) normalized.title = String(page.title).trim();
  if (page.lastUpdated !== undefined) normalized.lastUpdated = String(page.lastUpdated).trim();
  if (Array.isArray(page.sections)) {
    normalized.sections = page.sections
      .map((s) => ({
        heading: typeof s?.heading === 'string' ? s.heading.trim() : '',
        body: typeof s?.body === 'string' ? s.body.trim() : '',
      }))
      .filter((s) => s.heading || s.body);
  }
  return normalized;
};

export const getLegalPages = async () => {
  const doc = await ensureLegalPages();
  return mapDocToApi(doc);
};

export const updateLegalPages = async (body = {}) => {
  const update = {};
  const terms = normalizePage(body.terms);
  const privacy = normalizePage(body.privacy);
  if (terms) update.terms = terms;
  if (privacy) update.privacy = privacy;

  if (!Object.keys(update).length) {
    const error = new Error('No valid fields provided for update');
    error.statusCode = 400;
    throw error;
  }

  const existing = await ensureLegalPages();
  const doc = await LegalPageCMS.findByIdAndUpdate(
    existing._id,
    { $set: update },
    { new: true }
  );
  return mapDocToApi(doc);
};

export default {
  getLegalPages,
  updateLegalPages,
};
