const DEFAULT_OG_IMAGE_PATH = '/images/premium_supermarket_hero.png';

export const formatOfferShareDate = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

export const formatOfferSharePrice = (value) => {
  if (value == null || value === '') return '';
  const num = Number(value);
  if (Number.isNaN(num)) return '';
  return `€${num.toFixed(2)}`;
};

export const truncateOfferShareDescription = (text, maxLength = 180) => {
  const cleaned = String(text || '').replace(/\s+/g, ' ').trim();
  if (!cleaned) return '';
  if (cleaned.length <= maxLength) return cleaned;

  const slice = cleaned.slice(0, maxLength);
  const lastSpace = slice.lastIndexOf(' ');
  const trimmed = (lastSpace > maxLength * 0.6 ? slice.slice(0, lastSpace) : slice).trim();
  return `${trimmed}...`;
};

export const buildOfferDiscountLabel = (offer) => {
  const type = offer?.discountType || 'percentage';
  const value = offer?.discountValue;
  const num = Number(value);

  if (type === 'bogo') return 'Buy 1 Get 1';
  if (type === 'combo') return 'Combo Deal';

  if (value != null && value !== '' && !Number.isNaN(num)) {
    if (type === 'flat') return `Save €${num.toFixed(2)}`;
    return `Save ${num % 1 === 0 ? num : num.toFixed(2)}%`;
  }

  return String(offer?.offerBadge || '').trim();
};

export const resolveShareImageUrl = (imagePath, siteUrl) => {
  if (!imagePath) return '';
  const normalizedSiteUrl = String(siteUrl || '').replace(/\/$/, '');

  if (/^https?:\/\//i.test(imagePath) || imagePath.startsWith('data:')) {
    return imagePath;
  }

  if (imagePath.startsWith('/uploads') || imagePath.startsWith('/images')) {
    return `${normalizedSiteUrl}${imagePath}`;
  }

  if (imagePath.startsWith('uploads') || imagePath.startsWith('images')) {
    return `${normalizedSiteUrl}/${imagePath}`;
  }

  return imagePath;
};

/** Collapse whitespace for Open Graph meta tag values (Facebook expects a single line). */
export const normalizeOgText = (text) =>
  String(text || '')
    .replace(/[\r\n]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

/** Absolute, publicly reachable image URL (HTTPS when the site URL is HTTPS). */
export const resolveAbsoluteShareImageUrl = (imagePath, siteUrl) => {
  const resolved = resolveShareImageUrl(imagePath, siteUrl);
  if (!resolved) return '';
  const normalizedSiteUrl = String(siteUrl || '').replace(/\/$/, '');
  if (normalizedSiteUrl.startsWith('https://') && resolved.startsWith('http://')) {
    return resolved.replace(/^http:\/\//i, 'https://');
  }
  return resolved;
};

export const buildOfferShareTitle = (offer) => {
  const title = String(offer?.title || '').trim();
  const category = String(offer?.category || '').trim();
  if (title && category) return `${title} – ${category}`;
  return title || category || 'Special Offer';
};

export const buildOfferShareDescription = (offer) => {
  const discount = buildOfferDiscountLabel(offer);
  const wasPrice = formatOfferSharePrice(offer?.originalPrice);
  const nowPrice = formatOfferSharePrice(offer?.offerPrice);
  const department = String(offer?.offerDepartment || offer?.offerType || 'Supermarket').trim();
  const validTill = formatOfferShareDate(offer?.endDate);
  const shortDescription = truncateOfferShareDescription(
    offer?.description || offer?.subtitle || '',
    180
  );

  const priceParts = [
    discount ? `🔥 ${discount}` : '',
    wasPrice ? `💶 Was ${wasPrice}` : '',
    nowPrice ? `💚 Now ${nowPrice}` : '',
  ].filter(Boolean);

  const metaParts = [
    department ? `📍 ${department}` : '',
    validTill ? `📅 Valid Until ${validTill}` : '',
  ].filter(Boolean);

  const lines = [];
  if (priceParts.length) lines.push(priceParts.join('  ·  '));
  if (metaParts.length) lines.push(metaParts.join('  ·  '));
  if (shortDescription) lines.push(shortDescription);

  return lines.join('\n\n');
};

/** Single-line description for og:description / twitter:description (includes price & category). */
export const buildOfferOgDescription = (offer) => {
  const category = String(offer?.category || '').trim();
  const discount = buildOfferDiscountLabel(offer);
  const wasPrice = formatOfferSharePrice(offer?.originalPrice);
  const nowPrice = formatOfferSharePrice(offer?.offerPrice);
  const department = String(offer?.offerDepartment || offer?.offerType || 'Supermarket').trim();
  const validTill = formatOfferShareDate(offer?.endDate);
  const shortDescription = truncateOfferShareDescription(
    offer?.description || offer?.subtitle || '',
    200
  );

  const priceLabel = wasPrice && nowPrice
    ? `Was ${wasPrice}, now ${nowPrice}`
    : nowPrice
      ? `Now ${nowPrice}`
      : wasPrice
        ? `Was ${wasPrice}`
        : '';

  const parts = [
    category ? `Category: ${category}` : '',
    discount,
    priceLabel,
    department ? `Department: ${department}` : '',
    validTill ? `Valid until ${validTill}` : '',
    shortDescription,
  ].filter(Boolean);

  return normalizeOgText(parts.join(' · '));
};

export const buildOfferShareMeta = ({
  offer,
  siteUrl,
  siteName,
  fallbackImageUrl = '',
}) => {
  const normalizedSiteUrl = String(siteUrl || '').replace(/\/$/, '');
  const offerId = offer?.id || offer?._id || '';
  const title = buildOfferShareTitle(offer);
  const description = buildOfferShareDescription(offer);
  const ogDescription = buildOfferOgDescription(offer);
  const image =
    resolveAbsoluteShareImageUrl(offer?.image || offer?.imageUrl, normalizedSiteUrl) ||
    resolveAbsoluteShareImageUrl(fallbackImageUrl, normalizedSiteUrl) ||
    resolveAbsoluteShareImageUrl(DEFAULT_OG_IMAGE_PATH, normalizedSiteUrl);
  const url = `${normalizedSiteUrl}/offers/${encodeURIComponent(offerId)}`;

  return {
    title,
    description,
    ogDescription,
    image,
    imageAlt: title,
    url,
    siteName,
    type: 'website',
    twitterCard: 'summary_large_image',
  };
};

export const renderOfferShareHtml = (meta) => {
  const escapeHtml = (value) =>
    String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');

  const ogDescription = normalizeOgText(meta.ogDescription || meta.description);
  const imageIsHttps = String(meta.image || '').startsWith('https://');

  const tags = [
    ['property', 'og:type', meta.type],
    ['property', 'og:title', meta.title],
    ['property', 'og:description', ogDescription],
    ['property', 'og:image', meta.image],
    ['property', 'og:image:secure_url', imageIsHttps ? meta.image : ''],
    ['property', 'og:image:alt', meta.imageAlt || meta.title],
    ['property', 'og:url', meta.url],
    ['property', 'og:site_name', meta.siteName],
    ['property', 'og:locale', 'en_NL'],
    ['name', 'twitter:card', meta.twitterCard],
    ['name', 'twitter:title', meta.title],
    ['name', 'twitter:description', ogDescription],
    ['name', 'twitter:image', meta.image],
    ['name', 'description', ogDescription],
  ];

  const metaTags = tags
    .filter(([, , content]) => content)
    .map(
      ([attr, key, content]) =>
        `<meta ${attr}="${escapeHtml(key)}" content="${escapeHtml(content)}" />`
    )
    .join('\n  ');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(meta.title)} | Offers | ${escapeHtml(meta.siteName)}</title>
  ${metaTags}
  <link rel="canonical" href="${escapeHtml(meta.url)}" />
</head>
<body>
  <p><a href="${escapeHtml(meta.url)}">View offer: ${escapeHtml(meta.title)}</a></p>
  <script>window.location.replace(${JSON.stringify(meta.url)});</script>
</body>
</html>`;
};
