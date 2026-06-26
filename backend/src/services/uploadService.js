import fs from 'fs';
import path from 'path';

const UPLOAD_ROOT = path.join(process.cwd(), 'src/uploads');

export const isCloudinaryConfigured = () => false;

export const getLocalPublicUrl = (file) => {
  if (!file?.path) return null;
  const subdir = path.basename(path.dirname(file.path));
  return `/uploads/${subdir}/${file.filename}`;
};

export const persistUploadedFile = async (file) => {
  if (!file) return null;
  return getLocalPublicUrl(file);
};

export const persistBase64Upload = async (base64Str) => {
  if (!base64Str) return null;
  if (!base64Str.startsWith('data:image')) {
    return base64Str;
  }

  try {
    const matches = base64Str.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return base64Str;
    }

    const mimeType = matches[1];
    const ext = mimeType.split('/')[1] || 'png';
    const data = Buffer.from(matches[2], 'base64');

    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const filename = `base64-${uniqueSuffix}.${ext}`;
    const filepath = path.join(UPLOAD_ROOT, filename);

    if (!fs.existsSync(UPLOAD_ROOT)) {
      fs.mkdirSync(UPLOAD_ROOT, { recursive: true });
    }

    fs.writeFileSync(filepath, data);

    return `/uploads/${filename}`;
  } catch (error) {
    console.error('[upload-service] Failed to parse base64 image:', error.message);
    return base64Str;
  }
};

export const deleteStoredFile = (imageUrl) => {
  if (!imageUrl || imageUrl.startsWith('http')) return;
  if (!imageUrl.startsWith('/uploads/')) return;

  const relative = imageUrl.replace('/uploads/', '');
  const filepath = path.join(UPLOAD_ROOT, relative);
  if (fs.existsSync(filepath)) {
    fs.unlinkSync(filepath);
  }
};

export default {
  isCloudinaryConfigured,
  getLocalPublicUrl,
  persistUploadedFile,
  persistBase64Upload,
  deleteStoredFile,
};
