export const ABOUT_IMAGE_ACCEPT =
  '.jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp';

export const ABOUT_IMAGE_TYPE_ERROR =
  'Unsupported file format. Please upload JPG, JPEG, PNG, or WEBP image files only.';

export const ABOUT_IMAGE_SIZE_ERROR =
  'File size exceeds the maximum limit of 2 MB. Please upload a smaller image.';

export const ABOUT_MAX_IMAGE_BYTES = 2 * 1024 * 1024;

const ABOUT_IMAGE_EXTENSION = /\.(jpe?g|png|webp)$/i;
const ABOUT_IMAGE_MIME = /^image\/(jpe?g|png|webp)$/i;
const ABOUT_IMAGE_DATA_URL = /^data:image\/(jpe?g|png|webp);/i;

const EXTENSION_MIME_MAP = {
  jpg: ['image/jpeg', 'image/jpg'],
  jpeg: ['image/jpeg', 'image/jpg'],
  png: ['image/png'],
  webp: ['image/webp'],
};

const getExtensionKey = (filename = '') => {
  const match = filename.toLowerCase().match(/\.([a-z0-9]+)$/);
  return match?.[1] || '';
};

export const dataUrlByteSize = (dataUrl = '') => {
  const base64 = dataUrl.split(',')[1] || '';
  return Math.ceil((base64.length * 3) / 4);
};

export const isValidAboutImageFile = (file) => {
  if (!file) return false;
  if (file.size > ABOUT_MAX_IMAGE_BYTES) return false;

  const name = file.name || '';
  if (!ABOUT_IMAGE_EXTENSION.test(name)) return false;

  const extKey = getExtensionKey(name);
  const mime = (file.type || '').toLowerCase();
  if (!mime) return true;

  const allowedMimes = EXTENSION_MIME_MAP[extKey] || [];
  return allowedMimes.includes(mime) || ABOUT_IMAGE_MIME.test(mime);
};

export const isValidAboutImageDataUrl = (value) =>
  typeof value === 'string' && ABOUT_IMAGE_DATA_URL.test(value);

export const validateAboutImageFile = (file) => {
  if (!file) {
    return { valid: false, error: ABOUT_IMAGE_TYPE_ERROR };
  }
  if (!ABOUT_IMAGE_EXTENSION.test(file.name || '')) {
    const mime = (file.type || '').toLowerCase();
    if (!mime || !ABOUT_IMAGE_MIME.test(mime)) {
      return { valid: false, error: ABOUT_IMAGE_TYPE_ERROR };
    }
  }
  if (file.size > ABOUT_MAX_IMAGE_BYTES) {
    return { valid: false, error: ABOUT_IMAGE_SIZE_ERROR };
  }
  if (!isValidAboutImageFile(file)) {
    return { valid: false, error: ABOUT_IMAGE_TYPE_ERROR };
  }
  return { valid: true, error: null };
};

export const validateAboutImageValue = (value, { required = false } = {}) => {
  const trimmed = String(value || '').trim();
  if (!trimmed) {
    return required
      ? { valid: false, error: 'Please fill in all required fields.' }
      : { valid: true, error: null };
  }
  if (!trimmed.startsWith('data:')) {
    return { valid: true, error: null };
  }
  if (!isValidAboutImageDataUrl(trimmed)) {
    return { valid: false, error: ABOUT_IMAGE_TYPE_ERROR };
  }
  if (dataUrlByteSize(trimmed) > ABOUT_MAX_IMAGE_BYTES) {
    return { valid: false, error: ABOUT_IMAGE_SIZE_ERROR };
  }
  return { valid: true, error: null };
};
