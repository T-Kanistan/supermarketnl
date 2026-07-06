export const normalizeSearchText = (value) =>
  String(value ?? '')
    .toLowerCase()
    .replace(/[-_/]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const levenshtein = (a, b, maxDistance = Infinity) => {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  const lengthDiff = Math.abs(a.length - b.length);
  if (lengthDiff > maxDistance) return maxDistance + 1;

  let prev = new Array(b.length + 1);
  let curr = new Array(b.length + 1);

  for (let j = 0; j <= b.length; j += 1) prev[j] = j;

  for (let i = 1; i <= a.length; i += 1) {
    curr[0] = i;
    let rowMin = curr[0];

    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
      rowMin = Math.min(rowMin, curr[j]);
    }

    if (rowMin > maxDistance) return maxDistance + 1;
    [prev, curr] = [curr, prev];
  }

  return prev[b.length];
};

const maxEditDistance = (query) => {
  const len = query.length;
  if (len <= 3) return 1;
  if (len <= 6) return 2;
  return 3;
};

const fuzzyMatchTerm = (query, text) => {
  if (!query || !text) return false;
  if (text.includes(query)) return true;

  const limit = maxEditDistance(query);
  if (levenshtein(query, text, limit) <= limit) return true;

  const words = text.split(' ').filter(Boolean);
  for (const word of words) {
    if (word.includes(query)) return true;
    if (levenshtein(query, word, limit) <= limit) return true;

    const windowSizes = new Set([
      query.length - 1,
      query.length,
      query.length + 1,
    ]);

    for (const size of windowSizes) {
      if (size <= 0 || size > word.length) continue;
      for (let i = 0; i <= word.length - size; i += 1) {
        const slice = word.slice(i, i + size);
        if (levenshtein(query, slice, limit) <= limit) return true;
      }
    }
  }

  for (let size = query.length; size <= query.length + 1; size += 1) {
    if (size <= 0 || size > text.length) continue;
    for (let i = 0; i <= text.length - size; i += 1) {
      const slice = text.slice(i, i + size);
      if (levenshtein(query, slice, limit) <= limit) return true;
    }
  }

  return false;
};

export const matchesFuzzySearch = (query, fields = []) => {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) return true;
  if (normalizedQuery.length < 2) return true;

  const terms = normalizedQuery.split(' ').filter(Boolean);
  const normalizedFields = fields
    .flatMap((field) => {
      if (Array.isArray(field)) return field.map((value) => normalizeSearchText(value));
      return [normalizeSearchText(field)];
    })
    .filter(Boolean);

  if (!normalizedFields.length) return false;

  const combined = normalizedFields.join(' ');

  return terms.every(
    (term) =>
      normalizedFields.some((field) => fuzzyMatchTerm(term, field)) ||
      fuzzyMatchTerm(term, combined)
  );
};

export const filterByFuzzySearch = (items, query, getFields) => {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery || normalizedQuery.length < 2) return items;

  return items.filter((item) => matchesFuzzySearch(normalizedQuery, getFields(item)));
};
