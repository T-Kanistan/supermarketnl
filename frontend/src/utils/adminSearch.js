/** Shared admin-panel search helpers: case-insensitive, space-tolerant, partial match. */

export const ADMIN_NO_MATCH_MESSAGE = 'No matching records found.';

/**
 * Trim, lowercase, and collapse repeated whitespace.
 * "  Ba   NnEr  " → "ba nner"
 */
export const normalizeAdminSearchQuery = (value) =>
  String(value ?? '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();

/** Same as query normalize, but for field values (also stringify numbers/bools). */
export const normalizeAdminSearchField = (value) => {
  if (value == null) return '';
  if (typeof value === 'boolean') return value ? 'active' : 'inactive';
  if (typeof value === 'number') return String(value);
  if (Array.isArray(value)) {
    return value
      .map((entry) => normalizeAdminSearchField(entry))
      .filter(Boolean)
      .join(' ');
  }
  if (typeof value === 'object') {
    return Object.values(value)
      .map((entry) => normalizeAdminSearchField(entry))
      .filter(Boolean)
      .join(' ');
  }
  return normalizeAdminSearchQuery(value);
};

const compact = (text) => text.replace(/\s+/g, '');

/**
 * Returns true when `query` matches any of the provided fields.
 * - Case-insensitive
 * - Extra / internal spaces ignored via term split + compact fallback
 * - Partial (substring) matching
 * Empty / whitespace-only query matches everything.
 */
export const matchesAdminSearch = (query, fields = []) => {
  const normalizedQuery = normalizeAdminSearchQuery(query);
  if (!normalizedQuery) return true;

  const terms = normalizedQuery.split(' ').filter(Boolean);
  const compactQuery = compact(normalizedQuery);

  const normalizedFields = fields
    .flatMap((field) => {
      if (Array.isArray(field)) return field.map((v) => normalizeAdminSearchField(v));
      return [normalizeAdminSearchField(field)];
    })
    .filter(Boolean);

  if (!normalizedFields.length) return false;

  const combined = normalizedFields.join(' ');
  const combinedCompact = compact(combined);

  // "ba   nner" → compact "banner" matches field "banner"
  if (compactQuery && combinedCompact.includes(compactQuery)) return true;

  // Every space-separated term must appear as a substring somewhere
  return terms.every(
    (term) =>
      normalizedFields.some((field) => field.includes(term) || compact(field).includes(term)) ||
      combined.includes(term)
  );
};

export const filterByAdminSearch = (items, query, getFields) => {
  const normalizedQuery = normalizeAdminSearchQuery(query);
  if (!normalizedQuery) return items;
  return items.filter((item) => matchesAdminSearch(normalizedQuery, getFields(item)));
};

/** Human-readable status labels for search. */
export const statusSearchLabel = (value) => {
  if (value == null) return '';
  if (typeof value === 'boolean') return value ? 'active' : 'inactive';
  const raw = String(value).trim().toLowerCase();
  if (!raw) return '';
  if (raw === 'true' || raw === '1' || raw === 'active' || raw === 'published') return 'active';
  if (raw === 'false' || raw === '0' || raw === 'inactive' || raw === 'draft') return 'inactive';
  return raw.replace(/_/g, ' ');
};
