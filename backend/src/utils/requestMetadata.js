export const getClientIp = (req) => {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    const first = String(forwarded).split(',')[0].trim();
    if (first) return first;
  }
  return req.ip || req.socket?.remoteAddress || 'unknown';
};

const detectBrowser = (userAgent = '') => {
  const ua = userAgent.toLowerCase();
  if (ua.includes('edg/')) return 'Microsoft Edge';
  if (ua.includes('chrome/')) return 'Google Chrome';
  if (ua.includes('firefox/')) return 'Mozilla Firefox';
  if (ua.includes('safari/') && !ua.includes('chrome/')) return 'Safari';
  if (ua.includes('opr/') || ua.includes('opera')) return 'Opera';
  return 'Unknown Browser';
};

const detectDevice = (userAgent = '') => {
  const ua = userAgent.toLowerCase();
  if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) return 'Mobile';
  if (ua.includes('ipad') || ua.includes('tablet')) return 'Tablet';
  return 'Desktop';
};

export const getRequestMetadata = (req) => {
  const userAgent = req.headers['user-agent'] || 'unknown';
  return {
    ipAddress: getClientIp(req),
    browser: detectBrowser(userAgent),
    device: detectDevice(userAgent),
    userAgent,
  };
};
