export const normalizeSearchText = (value) =>
  String(value ?? '')
    .toLowerCase()
    .replace(/[-_/]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

export const levenshtein = (a, b, maxDistance = Infinity) => {
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

const getEditDistanceLimit = (term) => {
  const len = term.length;
  if (len <= 2) return 0;
  if (len <= 5) return 1;
  return 2;
};

export const matchesFuzzySearch = (query, fields = []) => {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) return true;

  const terms = normalizedQuery.split(' ').filter(Boolean);
  const normalizedFields = fields
    .flatMap((field) => {
      if (Array.isArray(field)) return field.map((value) => normalizeSearchText(value));
      return [normalizeSearchText(field)];
    })
    .filter(Boolean);

  if (!normalizedFields.length) return false;

  return terms.every((term) => {
    return normalizedFields.some((field) => {
      const fieldWords = field.split(' ').filter(Boolean);
      return fieldWords.some((word) => {
        // 1. Prefix match
        if (word.startsWith(term)) return true;

        // 2. Fuzzy match
        const limit = getEditDistanceLimit(term);
        if (limit > 0 && levenshtein(term, word, limit) <= limit) return true;

        return false;
      });
    });
  });
};

export const filterByFuzzySearch = (items, query, getFields) => {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) return items;

  return items.filter((item) => matchesFuzzySearch(normalizedQuery, getFields(item)));
};
