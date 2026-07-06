export const CMS_IMAGE_ACCEPT =
  '.jpg,.jpeg,.png,.webp,.gif,.svg,image/jpeg,image/png,image/webp,image/gif,image/svg+xml';

export const CMS_IMAGE_UPLOAD_ERROR =
  'Only image files (JPG, JPEG, PNG, WEBP, GIF, SVG) are allowed.';

const CMS_IMAGE_EXTENSION = /\.(jpe?g|png|webp|gif|svg)$/i;
const CMS_IMAGE_MIME = /^image\/(jpe?g|png|webp|gif|svg\+xml)$/i;
const CMS_IMAGE_DATA_URL = /^data:image\/(jpe?g|png|webp|gif|svg\+xml);/i;

const EXTENSION_MIME_MAP = {
  jpg: ['image/jpeg', 'image/jpg'],
  jpeg: ['image/jpeg', 'image/jpg'],
  png: ['image/png'],
  webp: ['image/webp'],
  gif: ['image/gif'],
  svg: ['image/svg+xml'],
};

const getExtensionKey = (filename = '') => {
  const match = filename.toLowerCase().match(/\.([a-z0-9]+)$/);
  return match?.[1] === 'jpg' || match?.[1] === 'jpeg'
    ? match[1]
    : match?.[1] || '';
};

export const isValidCmsImageFile = (file) => {
  if (!file) return false;

  const name = file.name || '';
  if (!CMS_IMAGE_EXTENSION.test(name)) return false;

  const extKey = getExtensionKey(name);
  const mime = (file.type || '').toLowerCase();
  if (!mime) return true;

  const allowedMimes = EXTENSION_MIME_MAP[extKey] || [];
  return allowedMimes.includes(mime) || CMS_IMAGE_MIME.test(mime);
};

export const isValidCmsImageDataUrl = (value) =>
  typeof value === 'string' && CMS_IMAGE_DATA_URL.test(value);

export const validateCmsImageFile = (file) => {
  if (!file) {
    return { valid: false, error: CMS_IMAGE_UPLOAD_ERROR };
  }
  if (isValidCmsImageFile(file)) {
    return { valid: true, error: null };
  }
  return { valid: false, error: CMS_IMAGE_UPLOAD_ERROR };
};

export const rejectInvalidCmsImageFile = (file, onError, inputEl) => {
  const { valid, error } = validateCmsImageFile(file);
  if (!valid) {
    onError?.(error);
    if (inputEl) inputEl.value = '';
    return true;
  }
  return false;
};

// Backward-compatible aliases used by About Us CMS
export const isValidAboutImageFile = isValidCmsImageFile;
export const isValidAboutImageDataUrl = isValidCmsImageDataUrl;
