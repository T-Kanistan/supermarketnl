export const LEGAL_LINK_LABEL_MAX = 50;
export const LEGAL_LINK_PATH_MAX = 255;

export const LABEL_REQUIRED = 'Please enter a label.';
export const LABEL_MAX = 'Label cannot exceed 50 characters.';
export const LABEL_DUPLICATE =
  'This legal link label already exists. Please enter a unique label.';

export const PATH_REQUIRED = 'Please enter a Path/URL.';
export const PATH_INVALID = 'Please enter a valid Path/URL.';
export const PATH_DUPLICATE =
  'This Path/URL already exists. Please enter a unique Path/URL.';

const collapseSpaces = (value) =>
  String(value ?? '')
    .replace(/\s+/g, ' ')
    .trim();

export const normalizeLegalLinkLabel = (value) => collapseSpaces(value).toLowerCase();

export const normalizeLegalLinkPath = (value) => String(value ?? '').trim().toLowerCase();

export const sanitizeLegalLinkLabel = (value) => collapseSpaces(value);

export const sanitizeLegalLinkPath = (value) => String(value ?? '').trim();

export const getLegalLinkPath = (link) => link?.path ?? link?.url ?? '';

export const isValidLegalLinkPath = (value) => {
  const trimmed = sanitizeLegalLinkPath(value);
  if (!trimmed || trimmed.length > LEGAL_LINK_PATH_MAX) return false;
  return trimmed.startsWith('/') || trimmed.startsWith('https://');
};

export const validateLegalLinkLabel = (value, { links = [], excludeIndex = null } = {}) => {
  const cleaned = sanitizeLegalLinkLabel(value);
  if (!cleaned) return LABEL_REQUIRED;
  if (cleaned.length > LEGAL_LINK_LABEL_MAX) return LABEL_MAX;

  const normalized = normalizeLegalLinkLabel(cleaned);
  const hasDuplicate = links.some((link, index) => {
    if (excludeIndex !== null && index === excludeIndex) return false;
    return normalizeLegalLinkLabel(link.label) === normalized;
  });
  if (hasDuplicate) return LABEL_DUPLICATE;
  return '';
};

export const validateLegalLinkPath = (value, { links = [], excludeIndex = null } = {}) => {
  const trimmed = sanitizeLegalLinkPath(value);
  if (!trimmed) return PATH_REQUIRED;
  if (!isValidLegalLinkPath(trimmed)) return PATH_INVALID;

  const normalized = normalizeLegalLinkPath(trimmed);
  const hasDuplicate = links.some((link, index) => {
    if (excludeIndex !== null && index === excludeIndex) return false;
    return normalizeLegalLinkPath(getLegalLinkPath(link)) === normalized;
  });
  if (hasDuplicate) return PATH_DUPLICATE;
  return '';
};

export const validateLegalLinkRow = (link, links, index) => ({
  label: validateLegalLinkLabel(link.label, { links, excludeIndex: index }),
  path: validateLegalLinkPath(getLegalLinkPath(link), { links, excludeIndex: index }),
});

export const assertLegalLinksValid = (links = []) => {
  if (!Array.isArray(links)) {
    const error = new Error('Legal links must be an array');
    error.statusCode = 400;
    throw error;
  }

  const normalizedLinks = links.map((link) => ({
    label: link.label,
    path: getLegalLinkPath(link),
    url: getLegalLinkPath(link),
  }));

  for (let index = 0; index < normalizedLinks.length; index += 1) {
    const rowErrors = validateLegalLinkRow(normalizedLinks[index], normalizedLinks, index);
    const firstError = rowErrors.label || rowErrors.path;
    if (firstError) {
      const error = new Error(firstError);
      error.statusCode = 400;
      throw error;
    }
  }
};

export const sanitizeLegalLinks = (links = []) =>
  links.map((link, index) => ({
    label: sanitizeLegalLinkLabel(link.label),
    url: sanitizeLegalLinkPath(getLegalLinkPath(link) || '/'),
    show: link.isVisible !== false && link.show !== false,
    order: link.displayOrder ?? link.order ?? index + 1,
  }));
