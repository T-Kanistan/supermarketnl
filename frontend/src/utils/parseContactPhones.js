const normalizePhone = (value) => String(value || '').replace(/\s+/g, ' ').trim();

const isPhoneLike = (value) => /^\+?[\d][\d\s\-()]{5,}[\d]$/.test(normalizePhone(value));

export const parseContactPhones = (phoneValue) => {
  const source = normalizePhone(phoneValue);
  if (!source) return [];

  const splitValues = source
    .split(/[\n,;|]+/)
    .map(normalizePhone)
    .filter(Boolean);

  if (splitValues.length > 1) {
    return [...new Set(splitValues)];
  }

  const spacedMatches = source.match(/\+[\d][\d\s\-()]{5,}[\d]/g);
  if (spacedMatches && spacedMatches.length > 1) {
    return [...new Set(spacedMatches.map(normalizePhone))];
  }

  if (isPhoneLike(source)) {
    return [source];
  }

  return splitValues.length ? splitValues : [source];
};

export const buildPhoneHref = (phone) => `tel:${String(phone || '').replace(/[^\d+]/g, '')}`;
