const parseHexColor = (hex) => {
  if (!hex) return null;
  let value = hex.replace('#', '').trim();
  if (value.length === 3) {
    value = value.split('').map((char) => char + char).join('');
  }
  if (value.length !== 6) return null;
  const int = parseInt(value, 16);
  if (Number.isNaN(int)) return null;
  return {
    r: (int >> 16) & 255,
    g: (int >> 8) & 255,
    b: int & 255,
  };
};

const toRgba = (hex, alpha = 0.55) => {
  const rgb = parseHexColor(hex);
  if (!rgb) return `rgba(15, 23, 42, ${alpha})`;
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
};

export const getBannerOverlayStyle = (banner, options = {}) => {
  const color = banner?.overlayColor || options.overlayColor || '#0f172a';
  const opacity =
    banner?.overlayOpacity !== undefined && banner?.overlayOpacity !== null
      ? Number(banner.overlayOpacity)
      : options.overlayOpacity ?? 0.55;

  return {
    background: `linear-gradient(90deg, ${toRgba(color, opacity)} 0%, ${toRgba(color, Math.max(opacity - 0.2, 0.1))} 45%, ${toRgba(color, Math.max(opacity - 0.35, 0.05))} 100%)`,
  };
};
