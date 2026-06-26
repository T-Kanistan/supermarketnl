import fs from 'fs';
import path from 'path';
import multer from 'multer';

import { UPLOAD_ROOT } from '../config/paths.js';

const uploadDir = path.join(UPLOAD_ROOT, 'homepage-about');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `about-${uniqueSuffix}${path.extname(file.originalname).toLowerCase()}`);
  },
});

const fileFilter = (_req, file, cb) => {
  const allowed = /jpeg|jpg|png|webp/;
  const extOk = allowed.test(path.extname(file.originalname).toLowerCase());
  const mimeOk = allowed.test(file.mimetype);
  if (extOk && mimeOk) return cb(null, true);
  cb(new Error('Only jpg, jpeg, png, and webp images are allowed'));
};

export const homepageAboutUpload = multer({
  storage,
  limits: { fileSize: 3 * 1024 * 1024 },
  fileFilter,
});

export const getHomepageAboutPublicPath = (filename) => `/uploads/homepage-about/${filename}`;
