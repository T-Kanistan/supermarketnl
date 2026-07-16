import path from 'path';

export const CMS_IMAGE_MAX_BYTES = 5 * 1024 * 1024;

export const CMS_IMAGE_TYPE_ERROR =
  'Unsupported file format. Please upload JPG, JPEG, PNG, or WEBP image files only.';

export const CMS_IMAGE_SIZE_ERROR =
  'File size exceeds the maximum limit of 5 MB. Please upload a smaller image.';

/** @deprecated Use CMS_IMAGE_TYPE_ERROR */
export const CMS_IMAGE_UPLOAD_ERROR = CMS_IMAGE_TYPE_ERROR;

export const CMS_IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp']);

export const CMS_IMAGE_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
]);

const EXTENSION_MIME_MAP = {
  '.jpg': ['image/jpeg', 'image/jpg'],
  '.jpeg': ['image/jpeg', 'image/jpg'],
  '.png': ['image/png'],
  '.webp': ['image/webp'],
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

export const isAllowedCmsImageFile = (file) => {
  if (!file?.originalname) return false;

  const ext = path.extname(file.originalname).toLowerCase();
  if (!CMS_IMAGE_EXTENSIONS.has(ext)) return false;

  const mime = (file.mimetype || '').toLowerCase();
  if (!mime) return true;

  const allowedMimes = EXTENSION_MIME_MAP[ext] || [];
  return allowedMimes.includes(mime) && CMS_IMAGE_MIME_TYPES.has(mime);
};

export const isAllowedCmsImageDataUrl = (value) =>
  typeof value === 'string' &&
  /^data:image\/(jpeg|jpg|png|webp);base64,/i.test(value);

export const cmsImageMulterFilter = (_req, file, cb) => {
  if (isAllowedCmsImageFile(file)) return cb(null, true);
  cb(new Error(CMS_IMAGE_TYPE_ERROR));
};
