import fs from 'fs';
import path from 'path';
import multer from 'multer';

import { UPLOAD_ROOT } from '../config/paths.js';

const cvUploadDir = path.join(UPLOAD_ROOT, 'resumes');
const legacyCvUploadDir = path.join(UPLOAD_ROOT, 'job-applications');

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
    cb(null, `resume-${uniqueSuffix}${path.extname(file.originalname).toLowerCase()}`);
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

export const CV_UPLOAD_ERROR_MESSAGE = 'Please upload your Resume/CV (Maximum 2MB).';

export const handleCvUpload = (req, res, next) => {
  jobApplicationCvUpload.single('cv')(req, res, (err) => {
    if (!err) return next();
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: CV_UPLOAD_ERROR_MESSAGE,
      });
    }
    if (err.message === 'Only PDF, DOC, and DOCX files are allowed') {
      return res.status(400).json({
        success: false,
        message: 'Only PDF, DOC, and DOCX files are allowed',
      });
    }
    return next(err);
  });
};

export const getJobApplicationCvPublicPath = (filename) =>
  `/uploads/resumes/${filename}`;

const cvUploadDirResolved = path.resolve(cvUploadDir);
const legacyCvUploadDirResolved = path.resolve(legacyCvUploadDir);

export const resolveJobApplicationCvPath = (cvFile = '') => {
  if (!cvFile?.trim()) {
    const error = new Error('CV file not found for this application');
    error.statusCode = 404;
    throw error;
  }

  const normalized = cvFile.replace(/^\/uploads\/(resumes|job-applications)\//, '');
  const filename = path.basename(normalized);
  const candidates = [
    path.resolve(cvUploadDir, filename),
    path.resolve(legacyCvUploadDir, filename),
  ];

  const absolutePath = candidates.find(
    (candidate) =>
      (candidate.startsWith(cvUploadDirResolved) ||
        candidate.startsWith(legacyCvUploadDirResolved)) &&
      fs.existsSync(candidate)
  );

  if (!absolutePath) {
    const error = new Error('CV file not found on server');
    error.statusCode = 404;
    throw error;
  }

  return { absolutePath, filename };
};
