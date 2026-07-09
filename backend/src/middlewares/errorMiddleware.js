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
      if (req.originalUrl?.includes('/about')) {
        message = 'Image size must not exceed 2 MB.';
      } else if (
        req.originalUrl?.includes('home-banner') ||
        req.originalUrl?.includes('/banner') ||
        req.originalUrl?.includes('announcement')
      ) {
        message = 'Banner image file size must not exceed 5MB';
      } else {
        message = 'Image file size must not exceed 3MB';
      }
    } else {
      message = err.message;
    }
  }

  if (err.message?.includes('Only JPG, JPEG, PNG, and WEBP images are allowed')) {
    statusCode = 400;
    message = 'Only JPG, JPEG, PNG, and WEBP images are allowed.';
  }

  if (err.message?.includes('Only image files (JPG, JPEG, PNG, WEBP, GIF, SVG)')) {
    statusCode = 400;
    message = 'Only image files (JPG, JPEG, PNG, WEBP, GIF, SVG) are allowed.';
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
