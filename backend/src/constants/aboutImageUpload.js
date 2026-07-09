import path from 'path';

export const ABOUT_IMAGE_UPLOAD_TYPE_ERROR =
  'Only JPG, JPEG, PNG, and WEBP images are allowed.';

export const ABOUT_IMAGE_UPLOAD_SIZE_ERROR = 'Image size must not exceed 2 MB.';

export const ABOUT_IMAGE_MAX_BYTES = 2 * 1024 * 1024;

export const ABOUT_IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp']);

export const ABOUT_IMAGE_MIME_TYPES = new Set([
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

export const isAllowedAboutImageFile = (file) => {
  if (!file?.originalname) return false;

  const ext = path.extname(file.originalname).toLowerCase();
  if (!ABOUT_IMAGE_EXTENSIONS.has(ext)) return false;

  const mime = (file.mimetype || '').toLowerCase();
  if (!mime) return true;

  const allowedMimes = EXTENSION_MIME_MAP[ext] || [];
  return allowedMimes.includes(mime);
};

export const aboutImageMulterFilter = (_req, file, cb) => {
  if (isAllowedAboutImageFile(file)) return cb(null, true);
  cb(new Error(ABOUT_IMAGE_UPLOAD_TYPE_ERROR));
};
