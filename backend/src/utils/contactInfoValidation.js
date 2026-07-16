export const PHONE_REQUIRED = 'Phone number is required.';
export const PHONE_INVALID =
  "Please enter a valid international phone number. Each number must start with '+' followed by 8–15 digits. Multiple numbers can be separated using '/'.";

/** @deprecated Prefer PHONE_INVALID — kept for any older callers. */
export const PHONE_CHARS_INVALID = PHONE_INVALID;

export const EMAIL_REQUIRED = 'Email address is required.';
export const EMAIL_INVALID = 'Please enter a valid email address.';

const PHONE_ALLOWED_CHARS = /^[+\d\s/]+$/;
const PHONE_SEGMENT = /^\+\d{8,15}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const trim = (value) => String(value ?? '').trim();

export const splitContactPhoneSegments = (value) =>
  String(value ?? '')
    .split('/')
    .map((segment) => segment.replace(/\s+/g, '').trim());

export const isValidContactPhoneSegment = (segment) => PHONE_SEGMENT.test(segment);

export const validateContactPhone = (value) => {
  const trimmed = trim(value);

  if (!trimmed) {
    return { field: 'phoneNumber', message: PHONE_REQUIRED };
  }

  if (!PHONE_ALLOWED_CHARS.test(trimmed)) {
    return { field: 'phoneNumber', message: PHONE_INVALID };
  }

  const segments = splitContactPhoneSegments(trimmed);
  if (!segments.length || segments.some((segment) => !segment)) {
    return { field: 'phoneNumber', message: PHONE_INVALID };
  }

  if (!segments.every(isValidContactPhoneSegment)) {
    return { field: 'phoneNumber', message: PHONE_INVALID };
  }

  return null;
};

export const validateContactEmail = (value) => {
  const trimmed = trim(value);

  if (!trimmed) {
    return { field: 'emailAddress', message: EMAIL_REQUIRED };
  }

  if (
    /\s/.test(trimmed) ||
    trimmed.includes('@@') ||
    /^@/.test(trimmed) ||
    /@$/.test(trimmed) ||
    !trimmed.includes('@') ||
    !EMAIL_PATTERN.test(trimmed)
  ) {
    return { field: 'emailAddress', message: EMAIL_INVALID };
  }

  return null;
};

export const validateContactInfoPair = (phoneNumber, emailAddress) => {
  const errors = [];
  const phoneError = validateContactPhone(phoneNumber);
  const emailError = validateContactEmail(emailAddress);

  if (phoneError) errors.push(phoneError);
  if (emailError) errors.push(emailError);

  return errors;
};

export const assertContactInfoValid = (phoneNumber, emailAddress) => {
  const errors = validateContactInfoPair(phoneNumber, emailAddress);
  if (!errors.length) return;

  const error = new Error(errors[0].message);
  error.statusCode = 400;
  error.errors = errors;
  throw error;
};
