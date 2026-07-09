import { ADMIN_TEXT_LIMITS, validateAdminText } from './adminTextValidation';

const trim = (value) => String(value ?? '').trim();

export const SECTION_HEADING_REQUIRED = 'Please enter a section heading.';
export const SECTION_BODY_REQUIRED = 'Please enter the section content.';
export const LEGAL_PAGES_INCOMPLETE =
  'Please complete all required sections before saving.';

export const PAGE_KEYS = ['terms', 'privacy'];

export const {
  legalPageTitle: LEGAL_PAGE_TITLE_LIMIT,
  legalSectionHeading: LEGAL_SECTION_HEADING_LIMIT,
  legalSectionBody: LEGAL_SECTION_BODY_LIMIT,
} = ADMIN_TEXT_LIMITS;

export const getSectionFieldId = (pageKey, index, field) =>
  `legal-${pageKey}-section-${index}-${field}`;

export const getPageTitleFieldId = (pageKey) => `legal-${pageKey}-title`;

export const validateLegalPageTitle = (title) =>
  validateAdminText(title, {
    max: LEGAL_PAGE_TITLE_LIMIT.max,
    maxMessage: `Page title cannot exceed ${LEGAL_PAGE_TITLE_LIMIT.max} characters.`,
  });

export const validateLegalSection = (section = {}) => {
  const errors = {};
  const headingError = validateAdminText(section.heading, {
    required: true,
    max: LEGAL_SECTION_HEADING_LIMIT.max,
    requiredMessage: SECTION_HEADING_REQUIRED,
    maxMessage: `Section heading cannot exceed ${LEGAL_SECTION_HEADING_LIMIT.max} characters.`,
  });
  if (headingError) errors.heading = headingError;

  const bodyError = validateAdminText(section.body, {
    required: true,
    max: LEGAL_SECTION_BODY_LIMIT.max,
    requiredMessage: SECTION_BODY_REQUIRED,
    maxMessage: `Section content cannot exceed ${LEGAL_SECTION_BODY_LIMIT.max} characters.`,
    collapse: false,
  });
  if (bodyError) errors.body = bodyError;

  return errors;
};

export const validateLegalPagesForm = (formData = {}) => {
  const sectionErrors = {
    terms: [],
    privacy: [],
  };
  const pageErrors = {
    terms: {},
    privacy: {},
  };

  let isValid = true;

  PAGE_KEYS.forEach((pageKey) => {
    const titleError = validateLegalPageTitle(formData?.[pageKey]?.title);
    if (titleError) {
      pageErrors[pageKey].title = titleError;
      isValid = false;
    }

    const sections = Array.isArray(formData?.[pageKey]?.sections)
      ? formData[pageKey].sections
      : [];

    sectionErrors[pageKey] = sections.map((section) => {
      const errors = validateLegalSection(section);
      if (Object.keys(errors).length) isValid = false;
      return errors;
    });
  });

  return { sectionErrors, pageErrors, isValid };
};

export const findFirstLegalSectionError = (sectionErrors = {}, pageErrors = {}) => {
  for (const pageKey of PAGE_KEYS) {
    if (pageErrors[pageKey]?.title) {
      return { pageKey, field: 'title', index: null };
    }
    const pageSectionErrors = sectionErrors[pageKey] || [];
    for (let index = 0; index < pageSectionErrors.length; index += 1) {
      const errors = pageSectionErrors[index] || {};
      if (errors.heading) {
        return { pageKey, index, field: 'heading' };
      }
      if (errors.body) {
        return { pageKey, index, field: 'body' };
      }
    }
  }
  return null;
};

export const focusFirstLegalSectionError = (sectionErrors, pageErrors = {}) => {
  const first = findFirstLegalSectionError(sectionErrors, pageErrors);
  if (!first) return null;

  const elementId =
    first.field === 'title'
      ? getPageTitleFieldId(first.pageKey)
      : getSectionFieldId(first.pageKey, first.index, first.field);
  const element = document.getElementById(elementId);
  element?.focus();
  element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  return first;
};
