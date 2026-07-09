/** Shared Mongo search helpers for admin list endpoints. */

export const escapeRegex = (value = '') =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Normalize admin search input: lowercase, trim, collapse whitespace.
 */
export const normalizeAdminSearchQuery = (value) =>
  String(value ?? '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();

/**
 * Build a case-insensitive regex that tolerates extra spaces in the query
 * ("ba   nner" and "banner" both match "Banner").
 */
export const buildFlexibleSearchRegex = (rawQuery) => {
  const normalized = normalizeAdminSearchQuery(rawQuery);
  if (!normalized) return null;

  const compact = normalized.replace(/\s+/g, '');
  if (!compact) return null;

  const pattern = compact
    .split('')
    .map((char) => escapeRegex(char))
    .join('\\s*');

  return new RegExp(pattern, 'i');
};

/**
 * Build an $or clause across fields for one or more space-separated terms.
 * Every term must match at least one field ($and of per-term $or).
 */
export const buildMultiFieldSearchFilter = (rawQuery, fields = []) => {
  const normalized = normalizeAdminSearchQuery(rawQuery);
  if (!normalized || !fields.length) return null;

  const terms = normalized.split(' ').filter(Boolean);
  if (!terms.length) return null;

  const termFilters = terms.map((term) => {
    const compact = term.replace(/\s+/g, '');
    const pattern = compact
      .split('')
      .map((char) => escapeRegex(char))
      .join('\\s*');
    const regex = new RegExp(pattern, 'i');
    return {
      $or: fields.map((field) => ({ [field]: regex })),
    };
  });

  if (termFilters.length === 1) return termFilters[0];
  return { $and: termFilters };
};
