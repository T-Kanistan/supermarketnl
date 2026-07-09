import {
  ABOUT_IMAGE_SIZE_ERROR,
  ABOUT_IMAGE_TYPE_ERROR,
  validateAboutImageValue,
} from './aboutImageValidation.js';
import { ADMIN_TEXT_LIMITS, sanitizeAdminText } from './adminTextValidation.js';

const {
  sectionTitle,
  sectionDescription,
  missionTitle,
  missionDescription,
  ownerName: ownerNameLimit,
  ownerDesignation: ownerDesignationLimit,
  ownerQuote: ownerQuoteLimit,
  ownerExperience: ownerExperienceLimit,
  ownerBadge: ownerBadgeLimit,
} = ADMIN_TEXT_LIMITS;

const TITLE_REQUIRED = 'Title is required.';
const DESCRIPTION_REQUIRED = 'Description is required.';
const FIELDS_REQUIRED = 'Please fill in all required fields.';

export const OWNER_NAME_REQUIRED = 'Owner name is required.';
export const OWNER_NAME_INVALID = 'Owner name cannot contain numbers or special characters.';
export const DESIGNATION_REQUIRED = 'Designation is required.';
export const QUOTE_REQUIRED = "Please enter the owner's quote.";
export const PHONE_REQUIRED = 'Phone number is required.';
export const PHONE_CHARS_INVALID = "Only numbers, '+', spaces, and '/' are allowed.";
export const ADDRESS_REQUIRED = 'Address is required.';
export const SINCE_YEAR_REQUIRED = 'Since Year is required.';
export const SINCE_YEAR_INVALID = 'Please enter a valid 4-digit year.';
export const SINCE_YEAR_FUTURE = 'Year cannot be greater than the current year.';
export const EXPERIENCE_REQUIRED = 'Experience text is required.';
export const BADGE_REQUIRED = 'Badge text is required.';
export const PROFILE_PHOTO_REQUIRED = 'Please upload a profile photo.';

export const SECTION_TITLE_MAX_LENGTH = `Title cannot exceed ${sectionTitle.max} characters.`;
export const SECTION_DESCRIPTION_MAX_LENGTH = `Description cannot exceed ${sectionDescription.max} characters.`;
export const MISSION_TITLE_MAX_LENGTH = `Title cannot exceed ${missionTitle.max} characters.`;
export const MISSION_DESCRIPTION_MAX_LENGTH = `Description cannot exceed ${missionDescription.max} characters.`;
export const OWNER_NAME_MAX_LENGTH = `Owner name cannot exceed ${ownerNameLimit.max} characters.`;
export const OWNER_DESIGNATION_MAX_LENGTH = `Designation cannot exceed ${ownerDesignationLimit.max} characters.`;
export const OWNER_QUOTE_MAX_LENGTH = `Quote cannot exceed ${ownerQuoteLimit.max} characters.`;
export const OWNER_EXPERIENCE_MAX_LENGTH = `Experience text cannot exceed ${ownerExperienceLimit.max} characters.`;
export const OWNER_BADGE_MAX_LENGTH = `Badge text cannot exceed ${ownerBadgeLimit.max} characters.`;

const OWNER_NAME_PATTERN = /^[a-zA-Z\s'.-]+$/;
const PHONE_ALLOWED_CHARS = /^[+\d\s/]+$/;
const PHONE_SEGMENT = /^\+\d{8,15}$/;
const YEAR_PATTERN = /^\d{4}$/;
const MIN_YEAR = 1900;

const trim = (value) => String(value ?? '').trim();

export const ABOUT_FIELD_SCROLL_ORDER = [
  { section: 'intro', path: 'heroEyebrow' },
  { section: 'intro', path: 'heroHeading' },
  { section: 'intro', path: 'heroHighlight' },
  { section: 'intro', path: 'heroParagraphs.0' },
  { section: 'intro', path: 'heroImage' },
  { section: 'story', path: 'storyTitle' },
  { section: 'story', path: 'storyDescription' },
  { section: 'story', path: 'storyImage' },
  { section: 'owner', path: 'owner.name' },
  { section: 'owner', path: 'owner.designation' },
  { section: 'owner', path: 'owner.quote' },
  { section: 'owner', path: 'owner.phone' },
  { section: 'owner', path: 'owner.location' },
  { section: 'owner', path: 'owner.sinceYear' },
  { section: 'owner', path: 'owner.yearsServing' },
  { section: 'owner', path: 'owner.badge' },
  { section: 'owner', path: 'owner.photo' },
];

export const fieldDomId = (path) => `about-field-${path.replace(/\./g, '-')}`;

export const getPathValue = (page, path) => {
  if (path === 'heroParagraphs.0') return page.heroParagraphs?.[0];
  const keys = path.split('.');
  let ref = page;
  for (const key of keys) {
    ref = ref?.[key];
  }
  return ref;
};

export const setPathValue = (page, path, value) => {
  const next = structuredClone(page);
  if (path === 'heroParagraphs.0') {
    const paragraphs = [...(next.heroParagraphs || [])];
    while (paragraphs.length < 1) paragraphs.push('');
    paragraphs[0] = value;
    next.heroParagraphs = paragraphs;
    return next;
  }
  const keys = path.split('.');
  let ref = next;
  for (let i = 0; i < keys.length - 1; i += 1) {
    const key = keys[i];
    if (ref[key] == null) ref[key] = {};
    ref = ref[key];
  }
  ref[keys[keys.length - 1]] = value;
  return next;
};

export const sanitizeOwnerNameInput = (value = '') =>
  String(value).replace(/[^a-zA-Z\s'.-]/g, '');

export const sanitizeOwnerPhoneInput = (value = '') =>
  String(value).replace(/[^\d+\s/]/g, '');

export const sanitizeOwnerSinceYearInput = (value = '') =>
  String(value).replace(/\D/g, '').slice(0, 4);

const requiredText = (value, message) => {
  if (!trim(value)) return { valid: false, error: message };
  return { valid: true, error: null };
};

const requiredMaxText = (value, requiredMessage, max, maxMessage, { collapse = true } = {}) => {
  const cleaned = sanitizeAdminText(value, { collapse });
  if (!cleaned) return { valid: false, error: requiredMessage };
  if (cleaned.length > max) return { valid: false, error: maxMessage };
  return { valid: true, error: null };
};

export const validateOwnerName = (value) => {
  const cleaned = trim(value);
  if (!cleaned) return { valid: false, error: OWNER_NAME_REQUIRED };
  if (cleaned.length > ownerNameLimit.max) {
    return { valid: false, error: OWNER_NAME_MAX_LENGTH };
  }
  if (!OWNER_NAME_PATTERN.test(cleaned)) {
    return { valid: false, error: OWNER_NAME_INVALID };
  }
  return { valid: true, error: null };
};

export const validateOwnerDesignation = (value) =>
  requiredMaxText(
    value,
    DESIGNATION_REQUIRED,
    ownerDesignationLimit.max,
    OWNER_DESIGNATION_MAX_LENGTH
  );

export const validateOwnerQuote = (value) =>
  requiredMaxText(
    value,
    QUOTE_REQUIRED,
    ownerQuoteLimit.max,
    OWNER_QUOTE_MAX_LENGTH,
    { collapse: false }
  );

export const validateOwnerPhone = (value) => {
  const trimmed = trim(value);
  if (!trimmed) return { valid: false, error: PHONE_REQUIRED };
  if (!PHONE_ALLOWED_CHARS.test(trimmed)) {
    return { valid: false, error: PHONE_CHARS_INVALID };
  }

  const segments = trimmed.split('/').map((segment) => segment.replace(/\s/g, ''));
  if (segments.some((segment) => !segment) || !segments.length) {
    return { valid: false, error: PHONE_CHARS_INVALID };
  }
  if (!segments.every((segment) => PHONE_SEGMENT.test(segment))) {
    return { valid: false, error: PHONE_CHARS_INVALID };
  }

  return { valid: true, error: null };
};

export const validateOwnerAddress = (value) =>
  requiredText(value, ADDRESS_REQUIRED);

export const validateOwnerSinceYear = (value) => {
  const trimmed = trim(value);
  const currentYear = new Date().getFullYear();

  if (!trimmed) return { valid: false, error: SINCE_YEAR_REQUIRED };
  if (!YEAR_PATTERN.test(trimmed)) return { valid: false, error: SINCE_YEAR_INVALID };

  const year = Number(trimmed);
  if (year < MIN_YEAR) return { valid: false, error: SINCE_YEAR_INVALID };
  if (year > currentYear) return { valid: false, error: SINCE_YEAR_FUTURE };

  return { valid: true, error: null };
};

export const validateOwnerExperienceText = (value) =>
  requiredMaxText(
    value,
    EXPERIENCE_REQUIRED,
    ownerExperienceLimit.max,
    OWNER_EXPERIENCE_MAX_LENGTH
  );

export const validateOwnerBadgeText = (value) =>
  requiredMaxText(value, BADGE_REQUIRED, ownerBadgeLimit.max, OWNER_BADGE_MAX_LENGTH);

export const validateOwnerPhoto = (value) => {
  const trimmed = trim(value);
  if (!trimmed) return { valid: false, error: PROFILE_PHOTO_REQUIRED };

  if (trimmed.startsWith('data:')) {
    const imageCheck = validateAboutImageValue(trimmed, { required: false });
    if (!imageCheck.valid) return imageCheck;
  }

  return { valid: true, error: null };
};

const validateRequiredImage = (value) => {
  const trimmed = trim(value);
  if (!trimmed) return { valid: false, error: FIELDS_REQUIRED };
  if (trimmed.startsWith('data:')) {
    return validateAboutImageValue(trimmed, { required: false });
  }
  return { valid: true, error: null };
};

const FIELD_VALIDATORS = {
  heroEyebrow: (page) =>
    requiredMaxText(page.heroEyebrow, FIELDS_REQUIRED, sectionTitle.max, SECTION_TITLE_MAX_LENGTH),
  heroHeading: (page) =>
    requiredMaxText(page.heroHeading, TITLE_REQUIRED, sectionTitle.max, SECTION_TITLE_MAX_LENGTH),
  heroHighlight: (page) =>
    requiredMaxText(page.heroHighlight, FIELDS_REQUIRED, sectionTitle.max, SECTION_TITLE_MAX_LENGTH),
  'heroParagraphs.0': (page) =>
    requiredMaxText(
      page.heroParagraphs?.[0],
      DESCRIPTION_REQUIRED,
      sectionDescription.max,
      SECTION_DESCRIPTION_MAX_LENGTH,
      { collapse: false }
    ),
  heroImage: (page) => validateRequiredImage(page.heroImage),
  storyTitle: (page) =>
    requiredMaxText(page.storyTitle, TITLE_REQUIRED, sectionTitle.max, SECTION_TITLE_MAX_LENGTH),
  storyDescription: (page) =>
    requiredMaxText(
      page.storyDescription,
      DESCRIPTION_REQUIRED,
      sectionDescription.max,
      SECTION_DESCRIPTION_MAX_LENGTH,
      { collapse: false }
    ),
  storyImage: (page) => validateRequiredImage(page.storyImage),
  'owner.name': (page) => validateOwnerName(page.owner?.name),
  'owner.designation': (page) => validateOwnerDesignation(page.owner?.designation),
  'owner.quote': (page) => validateOwnerQuote(page.owner?.quote),
  'owner.phone': (page) => validateOwnerPhone(page.owner?.phone),
  'owner.location': (page) => validateOwnerAddress(page.owner?.location),
  'owner.sinceYear': (page) => validateOwnerSinceYear(page.owner?.sinceYear),
  'owner.yearsServing': (page) => validateOwnerExperienceText(page.owner?.yearsServing),
  'owner.badge': (page) => validateOwnerBadgeText(page.owner?.badge),
  'owner.photo': (page) => validateOwnerPhoto(page.owner?.photo),
};

export const getFieldError = (path, page) => {
  const validator = FIELD_VALIDATORS[path];
  if (!validator) return null;
  const result = validator(page);
  return result.valid ? null : result.error;
};

const resolveFieldErrors = (failures) => {
  if (!failures.length) return { valid: true, error: null };
  if (failures.length > 1) return { valid: false, error: FIELDS_REQUIRED };
  if (failures[0] === 'title') return { valid: false, error: TITLE_REQUIRED };
  if (failures[0] === 'description') return { valid: false, error: DESCRIPTION_REQUIRED };
  return { valid: false, error: FIELDS_REQUIRED };
};

const collectTextFailures = (checks) =>
  checks.filter((check) => !check.ok).map((check) => check.kind);

export const validateAboutListItem = (type, form = {}) => {
  const fieldErrors = {};

  if (type === 'timeline') {
    if (!trim(form.marker)) fieldErrors.marker = FIELDS_REQUIRED;
    else if (trim(form.marker).length > sectionTitle.max) fieldErrors.marker = SECTION_TITLE_MAX_LENGTH;
    if (!trim(form.title)) fieldErrors.title = TITLE_REQUIRED;
    else if (trim(form.title).length > sectionTitle.max) fieldErrors.title = SECTION_TITLE_MAX_LENGTH;
    if (!trim(form.description)) fieldErrors.description = DESCRIPTION_REQUIRED;
    else if (trim(form.description).length > sectionDescription.max) {
      fieldErrors.description = SECTION_DESCRIPTION_MAX_LENGTH;
    }
  }

  if (type === 'mvp') {
    if (!trim(form.title)) fieldErrors.title = TITLE_REQUIRED;
    else if (trim(form.title).length > missionTitle.max) fieldErrors.title = MISSION_TITLE_MAX_LENGTH;
    if (!trim(form.description)) fieldErrors.description = DESCRIPTION_REQUIRED;
    else if (trim(form.description).length > missionDescription.max) {
      fieldErrors.description = MISSION_DESCRIPTION_MAX_LENGTH;
    }
  }

  if (type === 'offers') {
    if (!trim(form.title)) fieldErrors.title = TITLE_REQUIRED;
    else if (trim(form.title).length > sectionTitle.max) fieldErrors.title = SECTION_TITLE_MAX_LENGTH;
    if (!trim(form.description)) fieldErrors.description = DESCRIPTION_REQUIRED;
    else if (trim(form.description).length > sectionDescription.max) {
      fieldErrors.description = SECTION_DESCRIPTION_MAX_LENGTH;
    }
    if (!trim(form.image)) {
      fieldErrors.image = FIELDS_REQUIRED;
    } else {
      const imageCheck = validateAboutImageValue(form.image, { required: true });
      if (!imageCheck.valid) fieldErrors.image = imageCheck.error;
    }
  }

  if (type === 'stats') {
    if (!trim(form.label)) fieldErrors.label = TITLE_REQUIRED;
    else if (trim(form.label).length > sectionTitle.max) fieldErrors.label = SECTION_TITLE_MAX_LENGTH;
    if (
      form.value === '' ||
      form.value === null ||
      form.value === undefined ||
      Number.isNaN(Number(form.value))
    ) {
      fieldErrors.value = FIELDS_REQUIRED;
    }
  }

  if (Object.keys(fieldErrors).length) {
    return {
      valid: false,
      error: Object.values(fieldErrors)[0],
      fieldErrors,
    };
  }

  return { valid: true, error: null, fieldErrors: {} };
};

const validateListSections = (page) => {
  const failures = [];

  (page.storyTimeline || []).forEach((item) => {
    failures.push(
      ...collectTextFailures([
        { ok: trim(item.marker) && trim(item.marker).length <= sectionTitle.max, kind: 'subtitle' },
        { ok: trim(item.title) && trim(item.title).length <= sectionTitle.max, kind: 'title' },
        {
          ok: trim(item.description) && trim(item.description).length <= sectionDescription.max,
          kind: 'description',
        },
      ])
    );
  });

  (page.mvpCards || []).forEach((item) => {
    failures.push(
      ...collectTextFailures([
        { ok: trim(item.title) && trim(item.title).length <= missionTitle.max, kind: 'title' },
        {
          ok: trim(item.description) && trim(item.description).length <= missionDescription.max,
          kind: 'description',
        },
      ])
    );
  });

  (page.offerings || []).forEach((item) => {
    failures.push(
      ...collectTextFailures([
        { ok: trim(item.title) && trim(item.title).length <= sectionTitle.max, kind: 'title' },
        {
          ok: trim(item.description) && trim(item.description).length <= sectionDescription.max,
          kind: 'description',
        },
        { ok: trim(item.image), kind: 'image' },
      ])
    );
  });

  (page.stats || []).forEach((item) => {
    failures.push(
      ...collectTextFailures([
        { ok: trim(item.label) && trim(item.label).length <= sectionTitle.max, kind: 'title' },
        {
          ok:
            item.value !== '' &&
            item.value !== null &&
            item.value !== undefined &&
            !Number.isNaN(Number(item.value)),
          kind: 'value',
        },
      ])
    );
  });

  return resolveFieldErrors(failures);
};

export const validateAboutPageSave = (page = {}) => {
  const fieldErrors = {};

  ABOUT_FIELD_SCROLL_ORDER.forEach(({ path }) => {
    const error = getFieldError(path, page);
    if (error) fieldErrors[path] = error;
  });

  const listResult = validateListSections(page);
  if (!listResult.valid) {
    const firstFieldPath = ABOUT_FIELD_SCROLL_ORDER.find((field) => fieldErrors[field.path])?.path;
    if (firstFieldPath) {
      return {
        valid: false,
        error: fieldErrors[firstFieldPath],
        fieldErrors,
        firstErrorField: firstFieldPath,
        firstErrorSection: ABOUT_FIELD_SCROLL_ORDER.find((f) => f.path === firstFieldPath)?.section,
      };
    }
    return { valid: false, error: listResult.error, fieldErrors, firstErrorField: null };
  }

  if (Object.keys(fieldErrors).length) {
    const first = ABOUT_FIELD_SCROLL_ORDER.find((field) => fieldErrors[field.path]);
    return {
      valid: false,
      error: fieldErrors[first.path],
      fieldErrors,
      firstErrorField: first.path,
      firstErrorSection: first.section,
    };
  }

  const offeringImageError = (page.offerings || [])
    .map((item) => validateAboutImageValue(item.image, { required: true }))
    .find((check) => !check.valid);
  if (offeringImageError) {
    return { valid: false, error: offeringImageError.error, fieldErrors: {} };
  }

  return { valid: true, error: null, fieldErrors: {} };
};

export const patchFieldError = (errors, path, error) => {
  const next = { ...errors };
  if (error) next[path] = error;
  else delete next[path];
  return next;
};
