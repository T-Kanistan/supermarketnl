import fs from 'fs';
import path from 'path';
import multer from 'multer';

import { UPLOAD_ROOT } from '../config/paths.js';
import { cmsImageMulterFilter } from '../constants/cmsImageUpload.js';

const offersUploadDir = path.join(UPLOAD_ROOT, 'offers');
if (!fs.existsSync(offersUploadDir)) {
  fs.mkdirSync(offersUploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, offersUploadDir),
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `offer-${uniqueSuffix}${path.extname(file.originalname).toLowerCase()}`);
  },
});

const fileFilter = cmsImageMulterFilter;

export const offerImageUpload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter,
});

export const getOfferImagePublicPath = (filename) => `/uploads/offers/${filename}`;
