import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import path from 'path';
import multer from 'multer';

// Ensure local upload directory exists under src/uploads
const uploadDir = path.join(process.cwd(), 'src/uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  }
  cb(new Error('Only images (jpeg, jpg, png, gif, webp) are allowed'));
};

export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter,
});

export const handleImageUpload = async (file) => {
  if (!file) return null;

  const hasCloudinary = 
    process.env.CLOUDINARY_CLOUD_NAME && 
    process.env.CLOUDINARY_API_KEY && 
    process.env.CLOUDINARY_API_SECRET;

  if (hasCloudinary) {
    try {
      const result = await cloudinary.uploader.upload(file.path, {
        folder: 'supermarket',
      });
      // Delete the temporary file on local disk
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
      return result.secure_url;
    } catch (error) {
      console.error('Cloudinary upload failed, falling back to local storage:', error.message);
      return `/uploads/${path.basename(file.path)}`;
    }
  } else {
    // Fall back to local file link
    return `/uploads/${path.basename(file.path)}`;
  }
};

export const handleBase64Upload = async (base64Str) => {
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

    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const filename = `base64-${uniqueSuffix}.${ext}`;
    const filepath = path.join(uploadDir, filename);

    fs.writeFileSync(filepath, data);

    const hasCloudinary = 
      process.env.CLOUDINARY_CLOUD_NAME && 
      process.env.CLOUDINARY_API_KEY && 
      process.env.CLOUDINARY_API_SECRET;

    if (hasCloudinary) {
      try {
        const result = await cloudinary.uploader.upload(filepath, {
          folder: 'supermarket',
        });
        if (fs.existsSync(filepath)) {
          fs.unlinkSync(filepath);
        }
        return result.secure_url;
      } catch (error) {
        console.error('Cloudinary base64 upload failed, falling back to local:', error.message);
        return `/uploads/${filename}`;
      }
    } else {
      return `/uploads/${filename}`;
    }
  } catch (error) {
    console.error('Failed to parse base64 image:', error);
    return base64Str;
  }
};
