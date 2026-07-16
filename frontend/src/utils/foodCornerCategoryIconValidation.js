export const FOOD_CORNER_CATEGORY_ICON_MAX_BYTES = 512 * 1024;

export const FOOD_CORNER_CATEGORY_ICON_ACCEPT =
  '.svg,.ico,.png,.webp,image/svg+xml,image/x-icon,image/vnd.microsoft.icon,image/png,image/webp';

export const FOOD_CORNER_CATEGORY_ICON_REQUIRED = 'Please upload a category icon.';

export const FOOD_CORNER_CATEGORY_ICON_SIZE_ERROR =
  'File size exceeds the maximum limit of 512 KB. Please upload a smaller image.';

export const FOOD_CORNER_CATEGORY_ICON_INVALID_TYPE =
  'Unsupported file format. Please upload SVG, ICO, PNG, or WEBP image files only.';

export const FOOD_CORNER_CATEGORY_NAME_MAX = 30;
export const FOOD_CORNER_CATEGORY_NAME_MIN = 2;
export const FOOD_CORNER_CATEGORY_SLUG_MAX = 30;

export const FOOD_CORNER_CATEGORY_NAME_MAX_ERROR =
  'Category Name cannot exceed 30 characters.';

export const FOOD_CORNER_CATEGORY_NAME_MIN_ERROR =
  'Category Name must be at least 2 characters.';

export const FOOD_CORNER_CATEGORY_SLUG_PATTERN_ERROR =
  'Slug can contain only lowercase letters, numbers and hyphens.';

export const FOOD_CORNER_CATEGORY_SLUG_MAX_ERROR =
  'Slug cannot exceed 30 characters.';

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const STRICT_ICON_EXT = /\.(svg|ico|png|webp)(\?.*)?$/i;
const LEGACY_DISPLAY_EXT = /\.(svg|ico|png|jpe?g|webp|gif|bmp)(\?.*)?$/i;
const STRICT_DATA_URL =
  /^data:image\/(png|svg\+xml|x-icon|vnd\.microsoft\.icon|webp);base64,/i;
const LEGACY_DATA_URL =
  /^data:image\/(png|svg\+xml|x-icon|vnd\.microsoft\.icon|jpe?g|webp|gif);base64,/i;

const ALLOWED_MIME = new Set([
  'image/svg+xml',
  'image/x-icon',
  'image/vnd.microsoft.icon',
  'image/png',
  'image/webp',
]);

const REJECTED_MIME = new Set([
  'image/jpeg',
  'image/jpg',
  'image/gif',
  'image/bmp',
  'image/tiff',
  'image/avif',
]);

const REJECTED_EXT = /\.(jpe?g|gif|bmp|tif|tiff|avif)$/i;

/** Display existing icons (including legacy photos) temporarily. */
export const isFoodCornerCategoryIconUrl = (icon) => {
  const value = String(icon || '').trim();
  if (!value) return false;
  if (value.startsWith('blob:')) return true;
  if (LEGACY_DATA_URL.test(value) || STRICT_DATA_URL.test(value)) return true;
  if (value.startsWith('/uploads/') || value.startsWith('http://') || value.startsWith('https://')) {
    return LEGACY_DISPLAY_EXT.test(value);
  }
  return false;
};

/** Strict URL/data rules for newly uploaded icons only. */
export const isStrictFoodCornerCategoryIconUrl = (icon) => {
  const value = String(icon || '').trim();
  if (!value) return false;
  if (value.startsWith('blob:')) return true;
  if (STRICT_DATA_URL.test(value)) return true;
  if (value.startsWith('/uploads/') || value.startsWith('http://') || value.startsWith('https://')) {
    return STRICT_ICON_EXT.test(value);
  }
  return false;
};

const getExtension = (name = '') => {
  const match = String(name).toLowerCase().match(/\.([a-z0-9]+)$/);
  return match ? `.${match[1]}` : '';
};

export const isValidFoodCornerCategoryIconFile = (file) => {
  if (!file) return false;
  const name = (file.name || '').toLowerCase();
  const mime = (file.type || '').toLowerCase();
  const ext = getExtension(name);

  if (REJECTED_EXT.test(name) || REJECTED_MIME.has(mime)) return false;
  if (!['.svg', '.ico', '.png', '.webp'].includes(ext)) return false;
  if (mime && !ALLOWED_MIME.has(mime)) return false;
  return true;
};

const readFileAsArrayBuffer = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error || new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });

const sniffIconFormat = (buffer) => {
  const bytes = new Uint8Array(buffer);
  if (bytes.length >= 4) {
    // PNG
    if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
      return 'png';
    }
    // ICO
    if (bytes[0] === 0x00 && bytes[1] === 0x00 && bytes[2] === 0x01 && bytes[3] === 0x00) {
      return 'ico';
    }
    // JPEG
    if (bytes[0] === 0xff && bytes[1] === 0xd8) return 'jpeg';
    // GIF
    if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) return 'gif';
    // WEBP
    const head = String.fromCharCode(...bytes.slice(0, 4));
    const mid = String.fromCharCode(...bytes.slice(8, 12));
    if (head === 'RIFF' && mid === 'WEBP') return 'webp';
  }

  const text = new TextDecoder('utf-8', { fatal: false })
    .decode(bytes.slice(0, Math.min(bytes.length, 512)))
    .trim()
    .toLowerCase();
  if (text.includes('<svg')) return 'svg';
  return null;
};

const pngHasTransparency = (buffer) => {
  const bytes = new Uint8Array(buffer);
  if (bytes.length < 26) return false;
  // IHDR color type is at byte offset 25
  const colorType = bytes[25];
  if (colorType === 4 || colorType === 6) return true;

  let offset = 8;
  const view = new DataView(buffer);
  while (offset + 8 <= bytes.length) {
    const length = view.getUint32(offset);
    const type = String.fromCharCode(
      bytes[offset + 4],
      bytes[offset + 5],
      bytes[offset + 6],
      bytes[offset + 7]
    );
    if (type === 'tRNS') return true;
    if (type === 'IEND') break;
    offset += 12 + length;
    if (length < 0 || offset > bytes.length) break;
  }
  return false;
};

const canvasHasTransparency = (file) =>
  new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const width = Math.min(img.naturalWidth || 0, 256);
        const height = Math.min(img.naturalHeight || 0, 256);
        if (!width || !height) {
          URL.revokeObjectURL(url);
          resolve(false);
          return;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        const { data } = ctx.getImageData(0, 0, width, height);
        let transparent = false;
        for (let i = 3; i < data.length; i += 4) {
          if (data[i] < 255) {
            transparent = true;
            break;
          }
        }
        URL.revokeObjectURL(url);
        resolve(transparent);
      } catch {
        URL.revokeObjectURL(url);
        resolve(false);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(false);
    };
    img.src = url;
  });

/**
 * Async file validation: extension/MIME, magic bytes, size, transparent PNG preferred.
 */
export const validateFoodCornerCategoryIconFile = async (file) => {
  if (!file) {
    return { valid: false, error: FOOD_CORNER_CATEGORY_ICON_REQUIRED };
  }

  if (!isValidFoodCornerCategoryIconFile(file)) {
    return { valid: false, error: FOOD_CORNER_CATEGORY_ICON_INVALID_TYPE };
  }

  if (file.size > FOOD_CORNER_CATEGORY_ICON_MAX_BYTES) {
    return { valid: false, error: FOOD_CORNER_CATEGORY_ICON_SIZE_ERROR };
  }

  try {
    const buffer = await readFileAsArrayBuffer(file);
    const sniffed = sniffIconFormat(buffer);
    const ext = getExtension(file.name);

    if (!sniffed || !['svg', 'ico', 'png', 'webp'].includes(sniffed)) {
      return { valid: false, error: FOOD_CORNER_CATEGORY_ICON_INVALID_TYPE };
    }

    // Reject renamed photos (e.g. .png extension on JPEG bytes)
    const expected = {
      '.svg': 'svg',
      '.ico': 'ico',
      '.png': 'png',
      '.webp': 'webp',
    };
    if (expected[ext] && sniffed !== expected[ext]) {
      return { valid: false, error: FOOD_CORNER_CATEGORY_ICON_INVALID_TYPE };
    }

    if (sniffed === 'png') {
      const transparent =
        pngHasTransparency(buffer) || (await canvasHasTransparency(file));
      if (!transparent) {
        return { valid: false, error: FOOD_CORNER_CATEGORY_ICON_INVALID_TYPE };
      }
    }
  } catch {
    return { valid: false, error: FOOD_CORNER_CATEGORY_ICON_INVALID_TYPE };
  }

  return { valid: true, error: '' };
};

export const validateFoodCornerCategoryIcon = (
  icon,
  { isEdit = false, existingIcon = '' } = {}
) => {
  const value = String(icon || '').trim();
  const existing = String(existingIcon || '').trim();

  if (!value) {
    // Keep legacy icons temporarily when editing and no new icon was uploaded.
    if (isEdit && isFoodCornerCategoryIconUrl(existing)) return '';
    return FOOD_CORNER_CATEGORY_ICON_REQUIRED;
  }

  if (value.startsWith('blob:')) {
    return FOOD_CORNER_CATEGORY_ICON_REQUIRED;
  }

  // Unchanged existing icon (including legacy photos)
  if (isEdit && existing && value === existing) {
    return '';
  }

  if (isStrictFoodCornerCategoryIconUrl(value)) {
    return '';
  }

  return FOOD_CORNER_CATEGORY_ICON_INVALID_TYPE;
};

export const validateFoodCornerCategoryName = (value) => {
  const name = String(value || '').trim();
  if (!name) return 'Please enter a category name.';
  if (name.length < FOOD_CORNER_CATEGORY_NAME_MIN) {
    return FOOD_CORNER_CATEGORY_NAME_MIN_ERROR;
  }
  if (name.length > FOOD_CORNER_CATEGORY_NAME_MAX) {
    return FOOD_CORNER_CATEGORY_NAME_MAX_ERROR;
  }
  return '';
};

export const validateFoodCornerCategorySlug = (value) => {
  const slug = String(value || '').trim();
  if (!slug) return 'Please enter a category slug.';
  if (slug.length > FOOD_CORNER_CATEGORY_SLUG_MAX) {
    return FOOD_CORNER_CATEGORY_SLUG_MAX_ERROR;
  }
  if (!SLUG_PATTERN.test(slug)) {
    return FOOD_CORNER_CATEGORY_SLUG_PATTERN_ERROR;
  }
  return '';
};

export const slugifyFoodCornerCategory = (value) =>
  String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, FOOD_CORNER_CATEGORY_SLUG_MAX);
