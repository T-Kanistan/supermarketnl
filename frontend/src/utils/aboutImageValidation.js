export const ABOUT_ALLOWED_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
];

export const ABOUT_ALLOWED_IMAGE_EXTENSION = /\.(jpe?g|png|webp|gif)$/i;

export const isValidAboutImageFile = (file) => {
  if (!file) return false;

  const mime = (file.type || '').toLowerCase();
  if (mime && ABOUT_ALLOWED_IMAGE_MIME_TYPES.includes(mime)) {
    return true;
  }

  return ABOUT_ALLOWED_IMAGE_EXTENSION.test(file.name || '');
};

export const isValidAboutImageDataUrl = (value) =>
  typeof value === 'string' && /^data:image\/(jpe?g|png|webp|gif);/i.test(value);
