import { SITE_OG_NAME, SITE_URL } from '../seo/siteConfig';

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

export const resolveShareImageUrl = (imagePath, siteUrl = SITE_URL) => {
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

export const buildOfferShareMeta = ({
  offer,
  siteUrl = SITE_URL,
  siteName = SITE_OG_NAME,
  fallbackImageUrl = '',
}) => {
  const normalizedSiteUrl = String(siteUrl || '').replace(/\/$/, '');
  const offerId = offer?.id || offer?._id || '';
  const title = buildOfferShareTitle(offer);
  const description = buildOfferShareDescription(offer);
  const image =
    resolveShareImageUrl(offer?.image || offer?.imageUrl, normalizedSiteUrl) ||
    resolveShareImageUrl(fallbackImageUrl, normalizedSiteUrl) ||
    `${normalizedSiteUrl}${DEFAULT_OG_IMAGE_PATH}`;
  const url = `${normalizedSiteUrl}/offers/${encodeURIComponent(offerId)}`;

  return {
    title,
    description,
    image,
    url,
    siteName,
    type: 'website',
    twitterCard: 'summary_large_image',
  };
};

export const buildOfferShareUrl = (offerId) => {
  if (!offerId) return `${SITE_URL}/offers`;
  return `${SITE_URL}/offers/${encodeURIComponent(offerId)}`;
};
