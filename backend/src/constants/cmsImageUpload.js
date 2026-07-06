import path from 'path';

export const CMS_IMAGE_UPLOAD_ERROR =
  'Only image files (JPG, JPEG, PNG, WEBP, GIF, SVG) are allowed.';

export const CMS_IMAGE_EXTENSIONS = new Set([
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
  '.gif',
  '.svg',
]);

export const CMS_IMAGE_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
]);

const EXTENSION_MIME_MAP = {
  '.jpg': ['image/jpeg', 'image/jpg'],
  '.jpeg': ['image/jpeg', 'image/jpg'],
  '.png': ['image/png'],
  '.webp': ['image/webp'],
  '.gif': ['image/gif'],
  '.svg': ['image/svg+xml'],
};

export const isAllowedCmsImageFile = (file) => {
  if (!file?.originalname) return false;

  const ext = path.extname(file.originalname).toLowerCase();
  if (!CMS_IMAGE_EXTENSIONS.has(ext)) return false;

  const mime = (file.mimetype || '').toLowerCase();
  if (!mime) return true;

  const allowedMimes = EXTENSION_MIME_MAP[ext] || [];
  return allowedMimes.includes(mime);
};

export const isAllowedCmsImageDataUrl = (value) =>
  typeof value === 'string' &&
  /^data:image\/(jpeg|jpg|png|webp|gif|svg\+xml);base64,/i.test(value);

export const cmsImageMulterFilter = (_req, file, cb) => {
  if (isAllowedCmsImageFile(file)) return cb(null, true);
  cb(new Error(CMS_IMAGE_UPLOAD_ERROR));
};
