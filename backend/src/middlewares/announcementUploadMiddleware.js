import fs from 'fs';
import path from 'path';
import multer from 'multer';

import { UPLOAD_ROOT } from '../config/paths.js';

const announcementsUploadDir = path.join(UPLOAD_ROOT, 'announcements');
if (!fs.existsSync(announcementsUploadDir)) {
  fs.mkdirSync(announcementsUploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, announcementsUploadDir),
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `banner-${uniqueSuffix}${path.extname(file.originalname).toLowerCase()}`);
  },
});

const fileFilter = (_req, file, cb) => {
  const allowed = /jpeg|jpg|png|webp/;
  const extOk = allowed.test(path.extname(file.originalname).toLowerCase());
  const mimeOk = allowed.test(file.mimetype);
  if (extOk && mimeOk) return cb(null, true);
  cb(new Error('Only jpg, jpeg, png, and webp images are allowed'));
};

export const announcementBannerUpload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter,
});

export const getAnnouncementBannerPublicPath = (filename) =>
  `/uploads/announcements/${filename}`;
