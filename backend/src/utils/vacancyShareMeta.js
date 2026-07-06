const DEFAULT_OG_IMAGE_PATH = '/images/premium_supermarket_hero.png';

const DEPARTMENT_IMAGES = {
  supermarket: '/images/vacancies-dept-supermarket.jpg',
  'food-corner': '/images/vacancies-dept-foodcorner.jpg',
};

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
    return DEPARTMENT_IMAGES['food-corner'];
  }

  if (vacancy?.department === 'supermarket') {
    return DEPARTMENT_IMAGES.supermarket;
  }

  return '';
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

export const buildVacancyOgDescription = (vacancy) => {
  const source = vacancy?.summary || vacancy?.description || '';
  return truncateVacancyShareDescription(source, 150);
};

export const buildVacancyShareUrl = (vacancyId, siteUrl) => {
  const normalizedSiteUrl = String(siteUrl || '').replace(/\/$/, '');
  if (!vacancyId) return `${normalizedSiteUrl}/vacancies`;
  return `${normalizedSiteUrl}/vacancies/${encodeURIComponent(vacancyId)}`;
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
  siteUrl,
  siteName,
  vacancyImageUrl = '',
  heroImageUrl = '',
}) => {
  const normalizedSiteUrl = String(siteUrl || '').replace(/\/$/, '');
  const vacancyId = vacancy?.id || vacancy?._id || '';
  const title = buildVacancyShareTitle(vacancy);
  const description = buildVacancyOgDescription(vacancy);
  const url = buildVacancyShareUrl(vacancyId, normalizedSiteUrl);
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

export const renderVacancyShareHtml = (meta) => {
  const escapeHtml = (value) =>
    String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');

  const tags = [
    ['property', 'og:type', meta.type],
    ['property', 'og:title', meta.title],
    ['property', 'og:description', meta.description],
    ['property', 'og:image', meta.image],
    ['property', 'og:url', meta.url],
    ['property', 'og:site_name', meta.siteName],
    ['property', 'og:locale', 'en_NL'],
    ['name', 'twitter:card', meta.twitterCard],
    ['name', 'twitter:title', meta.title],
    ['name', 'twitter:description', meta.description],
    ['name', 'twitter:image', meta.image],
    ['name', 'description', meta.description],
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
  <title>${escapeHtml(meta.title)}</title>
  ${metaTags}
  <link rel="canonical" href="${escapeHtml(meta.url)}" />
</head>
<body>
  <p><a href="${escapeHtml(meta.url)}">View vacancy: ${escapeHtml(meta.title)}</a></p>
  <pre style="white-space:pre-wrap;font-family:inherit;">${escapeHtml(meta.caption || '')}</pre>
</body>
</html>`;
};
