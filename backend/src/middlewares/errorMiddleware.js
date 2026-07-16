import {
  CMS_IMAGE_TYPE_ERROR,
  CMS_IMAGE_SIZE_ERROR,
  formatCmsImageSizeError,
  CMS_IMAGE_MAX_BYTES,
} from '../constants/cmsImageUpload.js';
import {
  ABOUT_IMAGE_UPLOAD_TYPE_ERROR,
  ABOUT_IMAGE_UPLOAD_SIZE_ERROR,
} from '../constants/aboutImageUpload.js';

export const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || (res.statusCode === 200 ? 500 : res.statusCode);
  let message = err.message;
  let errors = null;

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const duplicateFields = Object.keys(err.keyValue || {});
    const isJobApplicationDuplicate = duplicateFields.some((field) =>
      ['jobId', 'email', 'normalizedPhone'].includes(field)
    );

    if (isJobApplicationDuplicate) {
      statusCode = 409;
      message =
        "Our records show that you've already submitted an application for this vacancy. Each applicant can apply only once for the same job.";
      return res.status(statusCode).json({
        success: false,
        code: 'DUPLICATE_APPLICATION',
        title: "You've Already Applied",
        message,
      });
    }

    statusCode = 400;
    const field = duplicateFields[0] || 'field';
    message = `Duplicate field value entered: ${field}. Please use another value.`;
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation Error';
    errors = Object.values(err.errors).map((el) => el.message);
  }

  // Mongoose cast error (e.g. invalid ObjectId)
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid format for field: ${err.path}`;
  }

  // JWT token errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token. Please log in again.';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Your token has expired. Please log in again.';
  }

  if (err.name === 'MulterError') {
    statusCode = 400;
    if (err.code === 'LIMIT_FILE_SIZE') {
      const url = req.originalUrl || '';
      if (url.includes('/about')) {
        message = ABOUT_IMAGE_UPLOAD_SIZE_ERROR;
      } else if (url.includes('/products') || url.includes('product')) {
        message = formatCmsImageSizeError(2 * 1024 * 1024);
      } else if (url.includes('categor')) {
        message = formatCmsImageSizeError(2 * 1024 * 1024);
      } else {
        const limit = Number(err.limit) || CMS_IMAGE_MAX_BYTES;
        message =
          limit === CMS_IMAGE_MAX_BYTES || limit === 5 * 1024 * 1024
            ? CMS_IMAGE_SIZE_ERROR
            : formatCmsImageSizeError(limit);
      }
    } else {
      message = err.message;
    }
  }

  // Normalize image type errors to the shared user-facing message
  const typeHints = [
    'Only JPG, JPEG, PNG, and WEBP',
    'Only image files (JPG, JPEG, PNG, WEBP',
    'Unsupported file format',
    ABOUT_IMAGE_UPLOAD_TYPE_ERROR,
    CMS_IMAGE_TYPE_ERROR,
  ];
  if (typeHints.some((hint) => err.message?.includes(hint))) {
    statusCode = 400;
    if (req.originalUrl?.includes('/about') && err.message === ABOUT_IMAGE_UPLOAD_TYPE_ERROR) {
      message = CMS_IMAGE_TYPE_ERROR;
    } else if (err.message?.includes('SVG') && err.message?.includes('ICO')) {
      message = err.message;
    } else {
      message = CMS_IMAGE_TYPE_ERROR;
    }
  }

  if (err.errors && Array.isArray(err.errors)) {
    errors = err.errors;
  }

  res.status(statusCode).json({
    success: false,
    message,
    errors,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
};
