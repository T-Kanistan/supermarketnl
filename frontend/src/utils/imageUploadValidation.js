/** Shared admin image upload validation (Offers, Banners, Products, CMS, etc.). */

export const CMS_IMAGE_MAX_BYTES = 5 * 1024 * 1024;

export const CMS_IMAGE_ACCEPT =
  '.jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp';

export const CMS_IMAGE_TYPE_ERROR =
  'Unsupported file format. Please upload JPG, JPEG, PNG, or WEBP image files only.';

export const CMS_IMAGE_SIZE_ERROR =
  'File size exceeds the maximum limit of 5 MB. Please upload a smaller image.';

/** @deprecated Use CMS_IMAGE_TYPE_ERROR */
export const CMS_IMAGE_UPLOAD_ERROR = CMS_IMAGE_TYPE_ERROR;

const CMS_IMAGE_EXTENSION = /\.(jpe?g|png|webp)$/i;
const CMS_IMAGE_MIME = /^image\/(jpe?g|png|webp)$/i;
const CMS_IMAGE_DATA_URL = /^data:image\/(jpe?g|png|webp);/i;

const EXTENSION_MIME_MAP = {
  jpg: ['image/jpeg', 'image/jpg'],
  jpeg: ['image/jpeg', 'image/jpg'],
  png: ['image/png'],
  webp: ['image/webp'],
};

const getExtensionKey = (filename = '') => {
  const match = String(filename).toLowerCase().match(/\.([a-z0-9]+)$/);
  return match?.[1] || '';
};

export const formatCmsImageSizeError = (maxBytes = CMS_IMAGE_MAX_BYTES) => {
  if (maxBytes === CMS_IMAGE_MAX_BYTES) return CMS_IMAGE_SIZE_ERROR;
  const mb = maxBytes / (1024 * 1024);
  if (mb >= 1) {
    const label = Number.isInteger(mb) ? String(mb) : mb.toFixed(1).replace(/\.0$/, '');
    return `File size exceeds the maximum limit of ${label} MB. Please upload a smaller image.`;
  }
  const kb = Math.round(maxBytes / 1024);
  return `File size exceeds the maximum limit of ${kb} KB. Please upload a smaller image.`;
};

export const isValidCmsImageFile = (file, { maxBytes = CMS_IMAGE_MAX_BYTES, checkSize = true } = {}) => {
  if (!file) return false;

  const name = file.name || '';
  if (!CMS_IMAGE_EXTENSION.test(name)) return false;

  const extKey = getExtensionKey(name);
  const mime = (file.type || '').toLowerCase();
  if (mime) {
    const allowedMimes = EXTENSION_MIME_MAP[extKey] || [];
    if (!allowedMimes.includes(mime) && !CMS_IMAGE_MIME.test(mime)) return false;
  }

  if (checkSize && typeof file.size === 'number' && file.size > maxBytes) return false;
  return true;
};

export const isValidCmsImageDataUrl = (value) =>
  typeof value === 'string' && CMS_IMAGE_DATA_URL.test(value);

/**
 * Validate file type and size. Returns { valid, error }.
 * @param {File} file
 * @param {{ maxBytes?: number }} [options]
 */
export const validateCmsImageFile = (file, { maxBytes = CMS_IMAGE_MAX_BYTES } = {}) => {
  if (!file) {
    return { valid: false, error: CMS_IMAGE_TYPE_ERROR };
  }

  const name = file.name || '';
  const mime = (file.type || '').toLowerCase();
  const extOk = CMS_IMAGE_EXTENSION.test(name);
  const mimeOk = !mime || CMS_IMAGE_MIME.test(mime);

  if (!extOk || !mimeOk || !isValidCmsImageFile(file, { maxBytes, checkSize: false })) {
    return { valid: false, error: CMS_IMAGE_TYPE_ERROR };
  }

  if (typeof file.size === 'number' && file.size > maxBytes) {
    return { valid: false, error: formatCmsImageSizeError(maxBytes) };
  }

  return { valid: true, error: null };
};

/**
 * Reject invalid files before upload. Returns true if rejected.
 * @param {File} file
 * @param {(message: string) => void} onError
 * @param {HTMLInputElement} [inputEl]
 * @param {{ maxBytes?: number }} [options]
 */
export const rejectInvalidCmsImageFile = (file, onError, inputEl, options = {}) => {
  const { valid, error } = validateCmsImageFile(file, options);
  if (!valid) {
    onError?.(error);
    if (inputEl) inputEl.value = '';
    return true;
  }
  return false;
};

// Backward-compatible aliases used by About Us CMS (prefer aboutImageValidation for 2 MB limit)
export const isValidAboutImageFile = (file) =>
  isValidCmsImageFile(file, { maxBytes: 2 * 1024 * 1024 });
export const isValidAboutImageDataUrl = isValidCmsImageDataUrl;
