const hits = new Map();

const WINDOW_MS = 15 * 60 * 1000;
const MAX_REQUESTS = 10;

/**
 * Simple in-memory rate limiter for public enquiry submissions.
 */
export const enquiryRateLimit = (req, res, next) => {
  const key = req.ip || req.headers['x-forwarded-for'] || 'unknown';
  const now = Date.now();

  const entry = hits.get(key) || { count: 0, resetAt: now + WINDOW_MS };
  if (now > entry.resetAt) {
    entry.count = 0;
    entry.resetAt = now + WINDOW_MS;
  }

  entry.count += 1;
  hits.set(key, entry);

  if (entry.count > MAX_REQUESTS) {
    return res.status(429).json({
      success: false,
      message: 'Too many enquiries submitted. Please try again later.',
    });
  }

  return next();
};

export default enquiryRateLimit;
