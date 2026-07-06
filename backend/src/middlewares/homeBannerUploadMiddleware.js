import fs from 'fs';
import path from 'path';
import multer from 'multer';

import { UPLOAD_ROOT } from '../config/paths.js';
import { cmsImageMulterFilter } from '../constants/cmsImageUpload.js';

const homeBannerUploadDir = path.join(UPLOAD_ROOT, 'home-banner');
if (!fs.existsSync(homeBannerUploadDir)) {
  fs.mkdirSync(homeBannerUploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, homeBannerUploadDir),
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `banner-${uniqueSuffix}${path.extname(file.originalname).toLowerCase()}`);
  },
});

const fileFilter = cmsImageMulterFilter;

export const homeBannerUpload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter,
});

export const getHomeBannerPublicPath = (filename) => `/uploads/home-banner/${filename}`;
