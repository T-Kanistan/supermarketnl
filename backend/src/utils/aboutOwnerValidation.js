const OWNER_NAME_REQUIRED = 'Owner name is required.';
const OWNER_NAME_INVALID = 'Owner name cannot contain numbers or special characters.';
const DESIGNATION_REQUIRED = 'Designation is required.';
const QUOTE_REQUIRED = "Please enter the owner's quote.";
const PHONE_REQUIRED = 'Phone number is required.';
const PHONE_CHARS_INVALID = "Only numbers, '+', spaces, and '/' are allowed.";
const ADDRESS_REQUIRED = 'Address is required.';
const SINCE_YEAR_REQUIRED = 'Since Year is required.';
const SINCE_YEAR_INVALID = 'Please enter a valid 4-digit year.';
const SINCE_YEAR_FUTURE = 'Year cannot be greater than the current year.';
const EXPERIENCE_REQUIRED = 'Experience text is required.';
const BADGE_REQUIRED = 'Badge text is required.';

const OWNER_NAME_PATTERN = /^[a-zA-Z\s'.-]+$/;
const PHONE_ALLOWED_CHARS = /^[+\d\s/]+$/;
const PHONE_SEGMENT = /^\+\d{8,15}$/;
const YEAR_PATTERN = /^\d{4}$/;
const MIN_YEAR = 1900;

const trim = (value) => String(value ?? '').trim();

const requiredText = (value, message) => {
  if (!trim(value)) return { valid: false, error: message };
  return { valid: true, error: null };
};

export const validateOwnerName = (value) => {
  const cleaned = trim(value);
  if (!cleaned) return { valid: false, error: OWNER_NAME_REQUIRED };
  if (!OWNER_NAME_PATTERN.test(cleaned)) {
    return { valid: false, error: OWNER_NAME_INVALID };
  }
  return { valid: true, error: null };
};

export const validateOwnerDesignation = (value) =>
  requiredText(value, DESIGNATION_REQUIRED);

export const validateOwnerQuote = (value) =>
  requiredText(value, QUOTE_REQUIRED);

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
  requiredText(value, EXPERIENCE_REQUIRED);

export const validateOwnerBadgeText = (value) =>
  requiredText(value, BADGE_REQUIRED);

export const validateOwnerPhoto = (value) => {
  if (!trim(value)) return { valid: false, error: 'Please upload a profile photo.' };
  return { valid: true, error: null };
};

export const validateOwnerSection = (owner = {}) => {
  const checks = [
    validateOwnerName(owner.owner_name),
    validateOwnerDesignation(owner.designation),
    validateOwnerQuote(owner.quote),
    validateOwnerPhone(owner.phone),
    validateOwnerAddress(owner.address),
    validateOwnerSinceYear(owner.since_year),
    validateOwnerExperienceText(owner.experience_text),
    validateOwnerBadgeText(owner.badge_text),
    validateOwnerPhoto(owner.profile_photo),
  ];

  const failed = checks.find((check) => !check.valid);
  return failed || { valid: true, error: null };
};
