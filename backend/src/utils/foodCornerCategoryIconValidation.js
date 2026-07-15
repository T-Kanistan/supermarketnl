const ICON_MAX_BYTES = 512 * 1024;

export const FOOD_CORNER_CATEGORY_ICON_REQUIRED = 'Please upload a category icon.';
export const FOOD_CORNER_CATEGORY_ICON_SIZE_MESSAGE =
  'Category icon must be less than or equal to 512 KB.';
export const FOOD_CORNER_CATEGORY_ICON_TYPE_MESSAGE =
  'Please upload a valid icon (SVG, ICO, or transparent PNG only).';

const STRICT_PATH_PATTERN = /\.(svg|ico|png)(\?.*)?$/i;
const LEGACY_PATH_PATTERN = /\.(svg|ico|png|jpe?g|webp|gif|bmp)(\?.*)?$/i;
const STRICT_DATA_URL_PATTERN =
  /^data:image\/(png|svg\+xml|x-icon|vnd\.microsoft\.icon);base64,/i;
const LEGACY_DATA_URL_PATTERN =
  /^data:image\/(png|svg\+xml|x-icon|vnd\.microsoft\.icon|jpe?g|webp|gif);base64,/i;

const MIME_TO_EXT = {
  'image/png': 'png',
  'image/svg+xml': 'svg',
  'image/x-icon': 'ico',
  'image/vnd.microsoft.icon': 'ico',
};

/** Display / keep existing icons (including temporary legacy photos). */
export const isFoodCornerCategoryIconUrl = (value) => {
  const raw = String(value || '').trim();
  if (!raw) return false;
  if (LEGACY_DATA_URL_PATTERN.test(raw) || STRICT_DATA_URL_PATTERN.test(raw)) return true;
  if (raw.startsWith('/uploads/') && LEGACY_PATH_PATTERN.test(raw)) return true;
  if ((raw.startsWith('http://') || raw.startsWith('https://')) && LEGACY_PATH_PATTERN.test(raw)) {
    return true;
  }
  return false;
};

export const isStrictFoodCornerCategoryIconUrl = (value) => {
  const raw = String(value || '').trim();
  if (!raw) return false;
  if (STRICT_DATA_URL_PATTERN.test(raw)) return true;
  if (raw.startsWith('/uploads/') && STRICT_PATH_PATTERN.test(raw)) return true;
  if ((raw.startsWith('http://') || raw.startsWith('https://')) && STRICT_PATH_PATTERN.test(raw)) {
    return true;
  }
  return false;
};

const getBase64Payload = (value) => {
  const match = String(value).match(/^data:([^;]+);base64,(.+)$/i);
  if (!match) return null;
  return {
    mime: match[1].toLowerCase(),
    buffer: Buffer.from(match[2], 'base64'),
  };
};

export const sniffIconFormat = (buffer) => {
  if (!Buffer.isBuffer(buffer) || buffer.length < 4) return null;

  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
    return 'png';
  }
  if (buffer[0] === 0x00 && buffer[1] === 0x00 && buffer[2] === 0x01 && buffer[3] === 0x00) {
    return 'ico';
  }
  if (buffer[0] === 0xff && buffer[1] === 0xd8) return 'jpeg';
  if (buffer.toString('ascii', 0, 3) === 'GIF') return 'gif';
  if (buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') {
    return 'webp';
  }
  if (buffer[0] === 0x42 && buffer[1] === 0x4d) return 'bmp';

  const text = buffer.slice(0, Math.min(buffer.length, 512)).toString('utf8').trim().toLowerCase();
  if (text.includes('<svg')) return 'svg';
  return null;
};

export const pngHasTransparency = (buffer) => {
  if (!Buffer.isBuffer(buffer) || buffer.length < 26) return false;
  const colorType = buffer[25];
  if (colorType === 4 || colorType === 6) return true;

  let offset = 8;
  while (offset + 8 <= buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.toString('ascii', offset + 4, offset + 8);
    if (type === 'tRNS') return true;
    if (type === 'IEND') break;
    offset += 12 + length;
    if (length < 0 || offset > buffer.length) break;
  }
  return false;
};

const assertValidIconBuffer = (buffer, declaredMime = '') => {
  if (!buffer || buffer.length === 0) {
    const error = new Error(FOOD_CORNER_CATEGORY_ICON_TYPE_MESSAGE);
    error.statusCode = 400;
    throw error;
  }

  if (buffer.length > ICON_MAX_BYTES) {
    const error = new Error(FOOD_CORNER_CATEGORY_ICON_SIZE_MESSAGE);
    error.statusCode = 400;
    throw error;
  }

  const sniffed = sniffIconFormat(buffer);
  if (!sniffed || !['svg', 'ico', 'png'].includes(sniffed)) {
    const error = new Error(FOOD_CORNER_CATEGORY_ICON_TYPE_MESSAGE);
    error.statusCode = 400;
    throw error;
  }

  if (declaredMime) {
    const expectedExt = MIME_TO_EXT[declaredMime];
    if (!expectedExt || expectedExt !== sniffed) {
      const error = new Error(FOOD_CORNER_CATEGORY_ICON_TYPE_MESSAGE);
      error.statusCode = 400;
      throw error;
    }
  }

  if (sniffed === 'png' && !pngHasTransparency(buffer)) {
    const error = new Error(FOOD_CORNER_CATEGORY_ICON_TYPE_MESSAGE);
    error.statusCode = 400;
    throw error;
  }

  return sniffed;
};

export const assertFoodCornerCategoryIcon = (value, { required = false } = {}) => {
  const raw = String(value ?? '').trim();

  if (!raw) {
    if (required) {
      const error = new Error(FOOD_CORNER_CATEGORY_ICON_REQUIRED);
      error.statusCode = 400;
      throw error;
    }
    return;
  }

  if (raw.startsWith('data:')) {
    const payload = getBase64Payload(raw);
    if (!payload || !STRICT_DATA_URL_PATTERN.test(raw)) {
      const error = new Error(FOOD_CORNER_CATEGORY_ICON_TYPE_MESSAGE);
      error.statusCode = 400;
      throw error;
    }
    assertValidIconBuffer(payload.buffer, payload.mime);
    return;
  }

  if (!isStrictFoodCornerCategoryIconUrl(raw)) {
    const error = new Error(FOOD_CORNER_CATEGORY_ICON_TYPE_MESSAGE);
    error.statusCode = 400;
    throw error;
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
      const error = new Error(FOOD_CORNER_CATEGORY_ICON_REQUIRED);
      error.statusCode = 400;
      throw error;
    }
    return existing;
  }

  // Keep unchanged existing icon (including temporary legacy photos)
  if (existing && (raw === existing || (!raw.startsWith('data:') && raw === existing))) {
    return existing;
  }

  assertFoodCornerCategoryIcon(raw, { required: true });

  if (raw.startsWith('data:')) {
    const uploaded = await uploadHandler(raw);
    if (!uploaded) {
      const error = new Error(FOOD_CORNER_CATEGORY_ICON_REQUIRED);
      error.statusCode = 400;
      throw error;
    }
    return uploaded;
  }

  return raw;
};

export const getFoodCornerCategoryIconExtFromDataUrl = (dataUrl) => {
  const payload = getBase64Payload(dataUrl);
  if (!payload) return null;
  const sniffed = sniffIconFormat(payload.buffer);
  return sniffed || MIME_TO_EXT[payload.mime] || null;
};
