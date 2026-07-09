export const CONTACT_FORM_MESSAGE_REQUIRED = 'Please enter your message.';
export const CONTACT_FORM_CONTACT_METHOD_REQUIRED =
  'Please provide either an email address or a phone number so we can contact you.';
export const CONTACT_FORM_EMAIL_INVALID = 'Please enter a valid email address.';
export const CONTACT_FORM_PHONE_INVALID = 'Please enter a valid phone number.';

const PHONE_PATTERN = /^[+\d\s-]+$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const trim = (value) => String(value ?? '').trim();

export const resolveContactFormPhone = (body = {}) =>
  trim(body.phone || body.phoneNumber);

export const resolveContactFormEmail = (body = {}) => trim(body.email);

export const validateContactFormEmail = (value) => {
  const email = trim(value);
  if (!email) return null;

  if (
    /\s/.test(email) ||
    email.includes('@@') ||
    /^@/.test(email) ||
    /@$/.test(email) ||
    !email.includes('@') ||
    !EMAIL_PATTERN.test(email)
  ) {
    return CONTACT_FORM_EMAIL_INVALID;
  }

  return null;
};

export const validateContactFormPhone = (value) => {
  const phone = trim(value);
  if (!phone) return null;

  if (!PHONE_PATTERN.test(phone)) {
    return CONTACT_FORM_PHONE_INVALID;
  }

  return null;
};

export const validateContactFormPayload = (body = {}) => {
  const errors = [];
  const email = resolveContactFormEmail(body);
  const phone = resolveContactFormPhone(body);
  const message = trim(body.message);

  if (!message) {
    errors.push({ field: 'message', message: CONTACT_FORM_MESSAGE_REQUIRED });
  }

  const hasEmail = Boolean(email);
  const hasPhone = Boolean(phone);

  if (!hasEmail && !hasPhone) {
    errors.push({ field: 'email', message: CONTACT_FORM_CONTACT_METHOD_REQUIRED });
    errors.push({ field: 'phone', message: CONTACT_FORM_CONTACT_METHOD_REQUIRED });
  } else {
    const emailError = validateContactFormEmail(email);
    if (emailError) errors.push({ field: 'email', message: emailError });

    const phoneError = validateContactFormPhone(phone);
    if (phoneError) errors.push({ field: 'phone', message: phoneError });
  }

  return errors;
};
