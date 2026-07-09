const ICON_MAX_BYTES = 2 * 1024 * 1024;

const ICON_REQUIRED_MESSAGE = 'Please upload a category icon.';
const ICON_SIZE_MESSAGE = 'Category icon must be less than or equal to 2 MB.';
const ICON_TYPE_MESSAGE = 'Only PNG, JPG, JPEG, SVG, and WEBP images are allowed.';

const ICON_PATH_PATTERN = /\.(png|jpe?g|webp|svg)(\?.*)?$/i;
const ICON_DATA_URL_PATTERN = /^data:image\/(png|jpe?g|webp|svg\+xml);base64,/i;

export const isFoodCornerCategoryIconUrl = (value) => {
  const raw = String(value || '').trim();
  if (!raw) return false;
  if (ICON_DATA_URL_PATTERN.test(raw)) return true;
  if (raw.startsWith('/uploads/') && ICON_PATH_PATTERN.test(raw)) return true;
  if ((raw.startsWith('http://') || raw.startsWith('https://')) && ICON_PATH_PATTERN.test(raw)) {
    return true;
  }
  return false;
};

const getBase64PayloadSize = (value) => {
  const match = String(value).match(/^data:[^;]+;base64,(.+)$/);
  if (!match) return 0;
  return Buffer.from(match[1], 'base64').length;
};

export const assertFoodCornerCategoryIcon = (value, { required = false } = {}) => {
  const raw = String(value ?? '').trim();

  if (!raw) {
    if (required) {
      const error = new Error(ICON_REQUIRED_MESSAGE);
      error.statusCode = 400;
      throw error;
    }
    return;
  }

  if (!isFoodCornerCategoryIconUrl(raw)) {
    const error = new Error(ICON_TYPE_MESSAGE);
    error.statusCode = 400;
    throw error;
  }

  if (raw.startsWith('data:')) {
    const size = getBase64PayloadSize(raw);
    if (size > ICON_MAX_BYTES) {
      const error = new Error(ICON_SIZE_MESSAGE);
      error.statusCode = 400;
      throw error;
    }
  }
};

export const resolveFoodCornerCategoryIcon = async (
  value,
  { required = false, existingIcon = '' } = {},
  uploadHandler
) => {
  const raw = String(value ?? '').trim();
  const existing = String(existingIcon ?? '').trim();

  if (!raw) {
    if (required && !isFoodCornerCategoryIconUrl(existing)) {
      const error = new Error(ICON_REQUIRED_MESSAGE);
      error.statusCode = 400;
      throw error;
    }
    return existing;
  }

  assertFoodCornerCategoryIcon(raw, { required: true });

  if (raw.startsWith('data:')) {
    const uploaded = await uploadHandler(raw);
    if (!uploaded) {
      const error = new Error(ICON_REQUIRED_MESSAGE);
      error.statusCode = 400;
      throw error;
    }
    return uploaded;
  }

  return raw;
};
