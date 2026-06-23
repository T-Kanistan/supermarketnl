import fs from 'fs';
import path from 'path';
import multer from 'multer';

const cvUploadDir = path.join(process.cwd(), 'src/uploads/job-applications');
if (!fs.existsSync(cvUploadDir)) {
  fs.mkdirSync(cvUploadDir, { recursive: true });
}

const allowedExtensions = ['.pdf', '.doc', '.docx'];
const allowedMimes = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, cvUploadDir),
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `cv-${uniqueSuffix}${path.extname(file.originalname).toLowerCase()}`);
  },
});

const fileFilter = (_req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const extOk = allowedExtensions.includes(ext);
  const mimeOk = allowedMimes.has(file.mimetype);
  if (extOk && mimeOk) return cb(null, true);
  cb(new Error('Only PDF, DOC, and DOCX files are allowed'));
};

export const jobApplicationCvUpload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter,
});

export const getJobApplicationCvPublicPath = (filename) =>
  `/uploads/job-applications/${filename}`;

const cvUploadDirResolved = path.resolve(cvUploadDir);

export const resolveJobApplicationCvPath = (cvFile = '') => {
  if (!cvFile?.trim()) {
    const error = new Error('CV file not found for this application');
    error.statusCode = 404;
    throw error;
  }

  const filename = path.basename(cvFile.replace(/^\/uploads\/job-applications\//, ''));
  const absolutePath = path.resolve(cvUploadDir, filename);

  if (!absolutePath.startsWith(cvUploadDirResolved)) {
    const error = new Error('Invalid CV file path');
    error.statusCode = 400;
    throw error;
  }

  if (!fs.existsSync(absolutePath)) {
    const error = new Error('CV file not found on server');
    error.statusCode = 404;
    throw error;
  }

  return { absolutePath, filename };
};
