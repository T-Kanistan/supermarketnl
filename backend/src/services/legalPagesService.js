import LegalPageCMS, { getDefaultLegalPages } from '../models/LegalPageCMS.js';
import { assertAdminText, ADMIN_TEXT_LIMITS } from '../utils/adminTextValidation.js';

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

const normalizePage = (page, pageLabel) => {
  if (!page || typeof page !== 'object') return undefined;
  const normalized = {};
  if (page.title !== undefined) {
    normalized.title = assertAdminText(page.title, {
      max: ADMIN_TEXT_LIMITS.legalPageTitle.max,
      maxMessage: `Page title cannot exceed ${ADMIN_TEXT_LIMITS.legalPageTitle.max} characters.`,
    });
  }
  if (page.lastUpdated !== undefined) normalized.lastUpdated = String(page.lastUpdated).trim();
  if (Array.isArray(page.sections)) {
    const incompleteIndex = page.sections.findIndex((section) => {
      const heading = typeof section?.heading === 'string' ? section.heading.trim() : '';
      const body = typeof section?.body === 'string' ? section.body.trim() : '';
      return !heading || !body;
    });

    if (incompleteIndex !== -1) {
      const error = new Error(
        `${pageLabel}: section ${incompleteIndex + 1} requires both heading and body before saving.`
      );
      error.statusCode = 400;
      throw error;
    }

    normalized.sections = page.sections.map((section, index) => {
      try {
        return {
          heading: assertAdminText(section?.heading, {
            required: true,
            max: ADMIN_TEXT_LIMITS.legalSectionHeading.max,
            requiredMessage: 'Section heading is required.',
            maxMessage: `Section heading cannot exceed ${ADMIN_TEXT_LIMITS.legalSectionHeading.max} characters.`,
          }),
          body: assertAdminText(section?.body, {
            required: true,
            max: ADMIN_TEXT_LIMITS.legalSectionBody.max,
            requiredMessage: 'Section content is required.',
            maxMessage: `Section content cannot exceed ${ADMIN_TEXT_LIMITS.legalSectionBody.max} characters.`,
            collapse: false,
          }),
        };
      } catch (err) {
        const error = new Error(`${pageLabel}: section ${index + 1} - ${err.message}`);
        error.statusCode = err.statusCode || 400;
        throw error;
      }
    });
  }
  return normalized;
};

export const getLegalPages = async () => {
  const doc = await ensureLegalPages();
  return mapDocToApi(doc);
};

export const updateLegalPages = async (body = {}) => {
  const update = {};
  const terms = normalizePage(body.terms, 'Terms & Conditions');
  const privacy = normalizePage(body.privacy, 'Privacy Policy');
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
