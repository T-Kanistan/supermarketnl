export const CONTACT_FORM_MESSAGE_REQUIRED = 'Please enter your message.';
export const CONTACT_FORM_CONTACT_METHOD_REQUIRED =
  'Please provide either an email address or a phone number so we can contact you.';
export const CONTACT_FORM_EMAIL_INVALID = 'Please enter a valid email address.';
export const CONTACT_FORM_PHONE_INVALID = 'Please enter a valid phone number.';

const PHONE_PATTERN = /^[+\d\s-]+$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const trim = (value) => String(value ?? '').trim();

const isValidEmail = (value) => {
  if (
    /\s/.test(value) ||
    value.includes('@@') ||
    /^@/.test(value) ||
    /@$/.test(value) ||
    !value.includes('@')
  ) {
    return false;
  }
  return EMAIL_PATTERN.test(value);
};

export const validateContactForm = (formData = {}) => {
  const fieldErrors = {};
  const email = trim(formData.email);
  const phone = trim(formData.phone);
  const message = trim(formData.message);

  if (!message) {
    fieldErrors.message = CONTACT_FORM_MESSAGE_REQUIRED;
  }

  const hasEmail = Boolean(email);
  const hasPhone = Boolean(phone);

  if (!hasEmail && !hasPhone) {
    fieldErrors.email = CONTACT_FORM_CONTACT_METHOD_REQUIRED;
    fieldErrors.phone = CONTACT_FORM_CONTACT_METHOD_REQUIRED;
  } else {
    if (hasEmail && !isValidEmail(email)) {
      fieldErrors.email = CONTACT_FORM_EMAIL_INVALID;
    }
    if (hasPhone && !PHONE_PATTERN.test(phone)) {
      fieldErrors.phone = CONTACT_FORM_PHONE_INVALID;
    }
  }

  return {
    fieldErrors,
    isValid: Object.keys(fieldErrors).length === 0,
  };
};

export const CONTACT_FORM_FIELD_ORDER = ['message', 'email', 'phone'];

export const focusFirstContactFormError = (fieldErrors) => {
  const firstField = CONTACT_FORM_FIELD_ORDER.find((field) => fieldErrors[field]);
  if (!firstField) return;

  const element = document.querySelector(`[name="${firstField}"]`);
  element?.focus();
  element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
};
