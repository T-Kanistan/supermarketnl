const PRESERVED_UPPERCASE = new Set([
  'BBQ',
  'BOGO',
  'FAQ',
  'VIP',
  'UK',
  'US',
  'EU',
]);

const capitalizeWord = (word) => {
  if (!word) return '';

  const lettersOnly = word.replace(/[^a-zA-Z]/g, '');
  if (lettersOnly && PRESERVED_UPPERCASE.has(lettersOnly.toUpperCase())) {
    return word.replace(/[a-zA-Z]+/g, (segment) => {
      const upper = segment.toUpperCase();
      return PRESERVED_UPPERCASE.has(upper)
        ? upper
        : segment.charAt(0).toUpperCase() + segment.slice(1).toLowerCase();
    });
  }

  if (!/[a-zA-Z]/.test(word)) return word;

  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
};

/**
 * Formats slug-like or lowercase category labels for display only.
 * Does not modify stored MongoDB values.
 */
export const formatCategoryName = (value) => {
  if (value === null || value === undefined) return '';

  const raw = String(value).trim();
  if (!raw) return '';

  return raw
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map(capitalizeWord)
    .join(' ');
};

export default formatCategoryName;
