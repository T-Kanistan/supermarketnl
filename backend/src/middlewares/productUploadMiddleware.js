import fs from 'fs';
import path from 'path';
import multer from 'multer';

import { UPLOAD_ROOT } from '../config/paths.js';

const productsUploadDir = path.join(UPLOAD_ROOT, 'products');
if (!fs.existsSync(productsUploadDir)) {
  fs.mkdirSync(productsUploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, productsUploadDir),
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `product-${uniqueSuffix}${path.extname(file.originalname).toLowerCase()}`);
  },
});

const ALLOWED_PRODUCT_IMAGE_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp']);
const ALLOWED_PRODUCT_IMAGE_MIME = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
]);

const fileFilter = (_req, file, cb) => {
  const ext = path.extname(file?.originalname || '').toLowerCase();
  const mime = String(file?.mimetype || '').toLowerCase();

  if (!ALLOWED_PRODUCT_IMAGE_EXT.has(ext) || !ALLOWED_PRODUCT_IMAGE_MIME.has(mime)) {
    cb(new Error('Only JPG, JPEG, PNG, and WEBP images are allowed.'));
    return;
  }
  cb(null, true);
};

export const productImageUpload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter,
});

export const getProductImagePublicPath = (filename) => `/uploads/products/${filename}`;
