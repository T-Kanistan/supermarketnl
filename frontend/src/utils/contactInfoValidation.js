export const PHONE_REQUIRED = 'Phone number is required.';
export const PHONE_CHARS_INVALID = "Only numbers, '+', spaces, and '/' are allowed.";

export const EMAIL_REQUIRED = 'Email address is required.';
export const EMAIL_INVALID = 'Please enter a valid email address.';

const PHONE_ALLOWED_CHARS = /^[+\d\s/]+$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const trim = (value) => String(value ?? '').trim();

export const CONTACT_INFO_FIELD_ORDER = ['contactPhone', 'contactEmail'];

export const CONTACT_INFO_FIELD_IDS = {
  contactPhone: 'contact-info-phone',
  contactEmail: 'contact-info-email',
};

export const sanitizeContactPhoneInput = (value = '') =>
  String(value).replace(/[^\d+\s/]/g, '');

export const validateContactPhone = (value) => {
  const trimmed = trim(value);

  if (!trimmed) {
    return PHONE_REQUIRED;
  }

  if (!PHONE_ALLOWED_CHARS.test(trimmed)) {
    return PHONE_CHARS_INVALID;
  }

  return '';
};

export const validateContactEmail = (value) => {
  const trimmed = trim(value);

  if (!trimmed) {
    return EMAIL_REQUIRED;
  }

  if (
    /\s/.test(trimmed) ||
    trimmed.includes('@@') ||
    /^@/.test(trimmed) ||
    /@$/.test(trimmed) ||
    !trimmed.includes('@') ||
    !EMAIL_PATTERN.test(trimmed)
  ) {
    return EMAIL_INVALID;
  }

  return '';
};

export const validateContactInfoForm = (formData) => {
  const contactPhone = validateContactPhone(formData?.contactPhone);
  const contactEmail = validateContactEmail(formData?.contactEmail);

  const fieldErrors = {};
  if (contactPhone) fieldErrors.contactPhone = contactPhone;
  if (contactEmail) fieldErrors.contactEmail = contactEmail;

  return {
    fieldErrors,
    isValid: Object.keys(fieldErrors).length === 0,
  };
};

export const focusFirstContactInfoError = (fieldErrors) => {
  const firstField = CONTACT_INFO_FIELD_ORDER.find((field) => fieldErrors[field]);
  if (!firstField) return;

  const element = document.getElementById(CONTACT_INFO_FIELD_IDS[firstField]);
  element?.focus();
  element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
};
