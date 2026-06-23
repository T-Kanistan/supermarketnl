import fs from 'fs';
import path from 'path';
import multer from 'multer';

const UPLOAD_ROOT = path.join(process.cwd(), 'src/uploads');

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

const imageFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|webp/;
  const ext = allowed.test(path.extname(file.originalname).toLowerCase());
  const mime = allowed.test(file.mimetype);
  if (ext && mime) return cb(null, true);
  cb(new Error('Only jpg, jpeg, png, and webp images are allowed'));
};

const footerLogoFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|webp|svg/;
  const ext = allowed.test(path.extname(file.originalname).toLowerCase());
  const mime = /image\/(jpeg|jpg|png|webp|svg\+xml)/.test(file.mimetype);
  if (ext && mime) return cb(null, true);
  cb(new Error('Only jpg, jpeg, png, webp, and svg images are allowed'));
};

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
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: imageFilter,
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

export const toPublicUrl = (file) => {
  if (!file) return null;
  const subdir = path.basename(path.dirname(file.path));
  return `/uploads/${subdir}/${file.filename}`;
};

export const deleteLocalImage = (imageUrl) => {
  if (!imageUrl || !imageUrl.startsWith('/uploads/')) return;
  const relative = imageUrl.replace('/uploads/', '');
  const filepath = path.join(UPLOAD_ROOT, relative);
  if (fs.existsSync(filepath)) {
    fs.unlinkSync(filepath);
  }
};

export default {
  aboutImageUpload,
  aboutUsImageUpload,
  footerLogoUpload,
  homepageAboutImageUpload,
  introImageUpload,
  storyImageUpload,
  ownerPhotoUpload,
  genericImageUpload,
  toPublicUrl,
  deleteLocalImage,
};
