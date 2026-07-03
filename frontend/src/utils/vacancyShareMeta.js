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

export const truncateVacancyShareDescription = (text, maxLength = 180) => {
  const cleaned = String(text || '').replace(/\s+/g, ' ').trim();
  if (!cleaned) return '';
  if (cleaned.length <= maxLength) return cleaned;

  const slice = cleaned.slice(0, maxLength);
  const lastSpace = slice.lastIndexOf(' ');
  const trimmed = (lastSpace > maxLength * 0.6 ? slice.slice(0, lastSpace) : slice).trim();
  return `${trimmed}...`;
};

export const buildVacancyShareTitle = (vacancy) => {
  const title = String(vacancy?.title || '').trim();
  const employmentType = String(vacancy?.employmentType || '').trim();
  if (title && employmentType) return `${title} – ${employmentType}`;
  return title || employmentType || 'Career Opportunity';
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
    180
  );
  const closingLabel = formatVacancyShareDate(vacancy?.closingDate);
  const metaParts = [
    vacancy?.location ? `📍 ${vacancy.location}` : '',
    vacancy?.workingHours ? `🕒 ${vacancy.workingHours}` : '',
    closingLabel ? `📅 Closes ${closingLabel}` : '',
  ].filter(Boolean);

  const metaLine = metaParts.join('  ·  ');
  if (metaLine && shortDescription) return `${metaLine}\n\n${shortDescription}`;
  return metaLine || shortDescription;
};

export const buildVacancyShareMeta = ({
  vacancy,
  siteUrl = SITE_URL,
  siteName = SITE_OG_NAME,
  heroImageUrl = '',
}) => {
  const normalizedSiteUrl = String(siteUrl || '').replace(/\/$/, '');
  const vacancyId = vacancy?.id || vacancy?._id || '';
  const title = buildVacancyShareTitle(vacancy);
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
