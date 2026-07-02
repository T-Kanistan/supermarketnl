import { SITE_OG_NAME, SITE_URL } from '../seo/siteConfig';

const DEFAULT_OG_IMAGE_PATH = '/images/premium_supermarket_hero.png';

export const formatVacancyShareDate = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

export const truncateVacancyShareDescription = (text, maxLength = 140) => {
  const cleaned = String(text || '').replace(/\s+/g, ' ').trim();
  if (!cleaned) return '';
  if (cleaned.length <= maxLength) return cleaned;

  const slice = cleaned.slice(0, maxLength);
  const lastSpace = slice.lastIndexOf(' ');
  const trimmed = (lastSpace > 80 ? slice.slice(0, lastSpace) : slice).trim();
  return `${trimmed}...`;
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

  return imagePath;
};

export const buildVacancyShareDescription = (vacancy) => {
  const shortDescription = truncateVacancyShareDescription(
    vacancy?.description || vacancy?.summary || '',
    140
  );
  const closingLabel = formatVacancyShareDate(vacancy?.closingDate);
  const detailParts = [
    vacancy?.employmentType,
    vacancy?.location,
    vacancy?.workingHours,
    closingLabel ? `Closes ${closingLabel}` : '',
  ].filter(Boolean);

  const prefix = detailParts.length ? `${detailParts.join(' · ')}.` : '';
  if (prefix && shortDescription) return `${prefix} ${shortDescription}`;
  return prefix || shortDescription;
};

export const buildVacancyShareMeta = ({
  vacancy,
  siteUrl = SITE_URL,
  siteName = SITE_OG_NAME,
  heroImageUrl = '',
}) => {
  const normalizedSiteUrl = String(siteUrl || '').replace(/\/$/, '');
  const vacancyId = vacancy?.id || vacancy?._id || '';
  const title = vacancy?.title || '';
  const description = buildVacancyShareDescription(vacancy);
  const image =
    resolveShareImageUrl(heroImageUrl, normalizedSiteUrl) ||
    `${normalizedSiteUrl}${DEFAULT_OG_IMAGE_PATH}`;
  const url = `${normalizedSiteUrl}/vacancies/${encodeURIComponent(vacancyId)}`;

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

export const buildVacancyShareUrl = (vacancyId) => {
  if (!vacancyId) return `${SITE_URL}/vacancies`;
  return `${SITE_URL}/vacancies/${encodeURIComponent(vacancyId)}`;
};
