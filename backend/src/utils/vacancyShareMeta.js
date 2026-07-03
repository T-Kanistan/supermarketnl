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

export const resolveShareImageUrl = (imagePath, siteUrl) => {
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
  siteUrl,
  siteName,
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
  <title>${escapeHtml(meta.title)} | Careers | ${escapeHtml(meta.siteName)}</title>
  ${metaTags}
  <link rel="canonical" href="${escapeHtml(meta.url)}" />
</head>
<body>
  <p><a href="${escapeHtml(meta.url)}">View vacancy: ${escapeHtml(meta.title)}</a></p>
</body>
</html>`;
};
