const requestCounts = new Map();

const WINDOW_MS = Number(process.env.AUTH_RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000;
const MAX_REQUESTS = Number(process.env.AUTH_RATE_LIMIT_MAX) || 20;

const cleanupExpired = (now) => {
  for (const [key, entry] of requestCounts.entries()) {
    if (entry.resetAt <= now) {
      requestCounts.delete(key);
    }
  }
};

export const authRateLimiter = (req, res, next) => {
  const now = Date.now();
  cleanupExpired(now);

  const key = `${req.ip || req.socket?.remoteAddress || 'unknown'}:${req.path}`;
  const entry = requestCounts.get(key);

  if (!entry || entry.resetAt <= now) {
    requestCounts.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return next();
  }

  if (entry.count >= MAX_REQUESTS) {
    const retryAfterSeconds = Math.ceil((entry.resetAt - now) / 1000);
    res.setHeader('Retry-After', String(retryAfterSeconds));
    return res.status(429).json({
      success: false,
      message: 'Too many authentication attempts. Please try again later.',
    });
  }

  entry.count += 1;
  requestCounts.set(key, entry);
  next();
};

export default authRateLimiter;
