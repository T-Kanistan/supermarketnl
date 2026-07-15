import fs from 'fs';
import path from 'path';
import { UPLOAD_ROOT } from '../config/paths.js';
import {
  CMS_IMAGE_UPLOAD_ERROR,
  isAllowedCmsImageDataUrl,
} from '../constants/cmsImageUpload.js';
import {
  assertFoodCornerCategoryIcon,
  getFoodCornerCategoryIconExtFromDataUrl,
  FOOD_CORNER_CATEGORY_ICON_TYPE_MESSAGE,
} from '../utils/foodCornerCategoryIconValidation.js';

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
  if (!base64Str.startsWith('data:')) {
    return base64Str;
  }

  if (!isAllowedCmsImageDataUrl(base64Str)) {
    throw new Error(CMS_IMAGE_UPLOAD_ERROR);
  }

  try {
    const matches = base64Str.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      throw new Error(CMS_IMAGE_UPLOAD_ERROR);
    }

    const mimeType = matches[1];
    let ext = mimeType.split('/')[1] || 'png';
    if (ext === 'svg+xml') ext = 'svg';
    if (ext === 'jpeg') ext = 'jpg';
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

/** Persist Food Corner category icons (SVG / ICO / transparent PNG only). */
export const persistFoodCornerCategoryIconUpload = async (base64Str) => {
  if (!base64Str) return null;
  if (!base64Str.startsWith('data:')) {
    return base64Str;
  }

  assertFoodCornerCategoryIcon(base64Str, { required: true });

  const matches = base64Str.match(/^data:([A-Za-z0-9.+\/-]+);base64,(.+)$/i);
  if (!matches || matches.length !== 3) {
    const error = new Error(FOOD_CORNER_CATEGORY_ICON_TYPE_MESSAGE);
    error.statusCode = 400;
    throw error;
  }

  const ext = getFoodCornerCategoryIconExtFromDataUrl(base64Str);
  if (!ext || !['svg', 'ico', 'png'].includes(ext)) {
    const error = new Error(FOOD_CORNER_CATEGORY_ICON_TYPE_MESSAGE);
    error.statusCode = 400;
    throw error;
  }

  const data = Buffer.from(matches[2], 'base64');
  const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
  const filename = `fc-category-icon-${uniqueSuffix}.${ext}`;
  const filepath = path.join(UPLOAD_ROOT, filename);

  if (!fs.existsSync(UPLOAD_ROOT)) {
    fs.mkdirSync(UPLOAD_ROOT, { recursive: true });
  }

  fs.writeFileSync(filepath, data);
  return `/uploads/${filename}`;
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
  persistFoodCornerCategoryIconUpload,
  deleteStoredFile,
};
