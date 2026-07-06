import { DEPARTMENT_CARD_IMAGES } from '../constants/vacancyDefaults';
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

export const truncateVacancyShareDescription = (text, maxLength = 150) => {
  const cleaned = String(text || '').replace(/\s+/g, ' ').trim();
  if (!cleaned) return '';
  if (cleaned.length <= maxLength) return cleaned;

  const slice = cleaned.slice(0, maxLength);
  const lastSpace = slice.lastIndexOf(' ');
  const trimmed = (lastSpace > maxLength * 0.6 ? slice.slice(0, lastSpace) : slice).trim();
  return `${trimmed}...`;
};

export const buildVacancyShareTitle = (vacancy) => {
  return String(vacancy?.title || '').trim() || 'Career Opportunity';
};

export const resolveVacancyImagePath = (vacancy) => {
  if (vacancy?.image || vacancy?.imageUrl) {
    return vacancy.image || vacancy.imageUrl;
  }

  if (vacancy?.department === 'food-corner') {
    return DEPARTMENT_CARD_IMAGES.foodCorner;
  }

  if (vacancy?.department === 'supermarket') {
    return DEPARTMENT_CARD_IMAGES.supermarket;
  }

  return '';
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

export const buildVacancyOgDescription = (vacancy) => {
  const source = vacancy?.summary || vacancy?.description || '';
  return truncateVacancyShareDescription(source, 150);
};

export const buildVacancyShareUrl = (vacancyId) => {
  if (!vacancyId) return `${SITE_URL}/vacancies`;
  return `${SITE_URL}/vacancies/${encodeURIComponent(vacancyId)}`;
};

export const buildVacancyShareCaption = (vacancy, vacancyUrl) => {
  const title = buildVacancyShareTitle(vacancy);
  const employmentType = String(vacancy?.employmentType || '').trim() || '—';
  const location = String(vacancy?.location || 'Hilversum, Netherlands').trim();
  const url = vacancyUrl || buildVacancyShareUrl(vacancy?.id || vacancy?._id);

  return [
    "📢 We're Hiring!",
    '',
    `Position: ${title}`,
    `Employment Type: ${employmentType}`,
    `Location: ${location}`,
    '',
    "Join the Wins Wereld Winkel team! If you're passionate about delivering excellent service and have the required skills, we'd love to hear from you.",
    '',
    'Apply now:',
    url,
    '',
    '#Hiring #Jobs #Hilversum #Netherlands #WinsWereldWinkel',
  ].join('\n');
};

export const buildVacancyShareMeta = ({
  vacancy,
  siteUrl = SITE_URL,
  siteName = SITE_OG_NAME,
  vacancyImageUrl = '',
  heroImageUrl = '',
}) => {
  const normalizedSiteUrl = String(siteUrl || '').replace(/\/$/, '');
  const vacancyId = vacancy?.id || vacancy?._id || '';
  const title = buildVacancyShareTitle(vacancy);
  const description = buildVacancyOgDescription(vacancy);
  const url = buildVacancyShareUrl(vacancyId);
  const caption = buildVacancyShareCaption(vacancy, url);
  const image =
    resolveShareImageUrl(vacancyImageUrl || resolveVacancyImagePath(vacancy), normalizedSiteUrl) ||
    resolveShareImageUrl(heroImageUrl, normalizedSiteUrl) ||
    `${normalizedSiteUrl}${DEFAULT_OG_IMAGE_PATH}`;

  return {
    title,
    description,
    caption,
    image,
    url,
    siteName,
    type: 'website',
    twitterCard: 'summary_large_image',
  };
};
