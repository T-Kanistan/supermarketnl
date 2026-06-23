/**
 * Build a WhatsApp click-to-chat URL for a customer phone number.
 */
export const buildWhatsAppLink = (phone, message = '') => {
  if (!phone) return '';

  const digits = String(phone).replace(/[^\d]/g, '');
  if (!digits) return '';

  const base = `https://wa.me/${digits}`;
  if (!message) return base;

  return `${base}?text=${encodeURIComponent(message)}`;
};

export default { buildWhatsAppLink };
