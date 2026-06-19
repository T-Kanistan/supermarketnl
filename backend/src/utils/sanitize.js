/**
 * Strip HTML tags and trim user-provided text fields.
 */
export const sanitizeText = (value) => {
  if (value === undefined || value === null) return '';
  return String(value)
    .replace(/<[^>]*>/g, '')
    .replace(/javascript:/gi, '')
    .trim();
};

export const sanitizeContactMessage = ({ name, email, phone, subject, message }) => ({
  name: sanitizeText(name),
  email: sanitizeText(email).toLowerCase(),
  phone: sanitizeText(phone),
  subject: sanitizeText(subject),
  message: sanitizeText(message),
});

export default { sanitizeText, sanitizeContactMessage };
