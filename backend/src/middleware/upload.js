import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { deleteStoredFile, getLocalPublicUrl, persistUploadedFile } from '../services/uploadService.js';
import { UPLOAD_ROOT } from '../config/paths.js';
import { cmsImageMulterFilter } from '../constants/cmsImageUpload.js';
import { aboutImageMulterFilter } from '../constants/aboutImageUpload.js';

const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

ensureDir(path.join(UPLOAD_ROOT, 'about'));
ensureDir(path.join(UPLOAD_ROOT, 'about-us'));
ensureDir(path.join(UPLOAD_ROOT, 'story'));
ensureDir(path.join(UPLOAD_ROOT, 'owner'));
ensureDir(path.join(UPLOAD_ROOT, 'footer'));
ensureDir(path.join(UPLOAD_ROOT, 'homepage-about'));

const imageFilter = cmsImageMulterFilter;
const aboutImageMimeFilter = cmsImageMulterFilter;
const footerLogoFilter = cmsImageMulterFilter;

const createStorage = (subdir) =>
  multer.diskStorage({
    destination: (req, file, cb) => {
      const dest = path.join(UPLOAD_ROOT, subdir);
      ensureDir(dest);
      cb(null, dest);
    },
    filename: (req, file, cb) => {
      const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      cb(null, `${unique}${path.extname(file.originalname).toLowerCase()}`);
    },
  });

export const aboutImageUpload = multer({
  storage: createStorage('about'),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: aboutImageMulterFilter,
});

export const genericImageUpload = multer({
  storage: createStorage('about'),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: imageFilter,
});

export const introImageUpload = multer({
  storage: createStorage('about-us'),
  limits: { fileSize: 3 * 1024 * 1024 },
  fileFilter: imageFilter,
});

export const storyImageUpload = multer({
  storage: createStorage('story'),
  limits: { fileSize: 3 * 1024 * 1024 },
  fileFilter: imageFilter,
});

export const ownerPhotoUpload = multer({
  storage: createStorage('owner'),
  limits: { fileSize: 3 * 1024 * 1024 },
  fileFilter: imageFilter,
});

export const aboutUsImageUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const map = {
        intro_image: 'about-us',
        story_image: 'story',
        owner_photo: 'owner',
      };
      const subdir = map[file.fieldname] || 'about-us';
      const dest = path.join(UPLOAD_ROOT, subdir);
      ensureDir(dest);
      cb(null, dest);
    },
    filename: (req, file, cb) => {
      const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      cb(null, `${unique}${path.extname(file.originalname).toLowerCase()}`);
    },
  }),
  limits: { fileSize: 3 * 1024 * 1024 },
  fileFilter: imageFilter,
});

export const footerLogoUpload = multer({
  storage: createStorage('footer'),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: footerLogoFilter,
});

export const homepageAboutImageUpload = multer({
  storage: createStorage('homepage-about'),
  limits: { fileSize: 3 * 1024 * 1024 },
  fileFilter: imageFilter,
});

export const toPublicUrl = getLocalPublicUrl;
export const deleteLocalImage = deleteStoredFile;
export { persistUploadedFile };
