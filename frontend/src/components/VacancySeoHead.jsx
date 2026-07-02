import { useEffect } from 'react';
import { SITE_NAME } from '../seo/siteConfig';
import { buildVacancyShareMeta } from '../utils/vacancyShareMeta';

const upsertMeta = (attr, key, content) => {
  if (!content) return;
  let element = document.querySelector(`meta[${attr}="${key}"]`);
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attr, key);
    document.head.appendChild(element);
  }
  element.setAttribute('content', content);
};

const upsertLink = (rel, href) => {
  if (!href) return;
  let element = document.querySelector(`link[rel="${rel}"]`);
  if (!element) {
    element = document.createElement('link');
    element.setAttribute('rel', rel);
    document.head.appendChild(element);
  }
  element.setAttribute('href', href);
};

const VacancySeoHead = ({ vacancy, heroImageUrl = '' }) => {
  useEffect(() => {
    if (!vacancy) return undefined;

    const meta = buildVacancyShareMeta({ vacancy, heroImageUrl });
    const pageTitle = meta.title ? `${meta.title} | Careers | ${SITE_NAME}` : `Careers | ${SITE_NAME}`;

    document.title = pageTitle;
    upsertMeta('name', 'description', meta.description);
    upsertLink('canonical', meta.url);

    upsertMeta('property', 'og:type', meta.type);
    upsertMeta('property', 'og:title', meta.title);
    upsertMeta('property', 'og:description', meta.description);
    upsertMeta('property', 'og:image', meta.image);
    upsertMeta('property', 'og:url', meta.url);
    upsertMeta('property', 'og:site_name', meta.siteName);
    upsertMeta('property', 'og:locale', 'en_NL');

    upsertMeta('name', 'twitter:card', meta.twitterCard);
    upsertMeta('name', 'twitter:title', meta.title);
    upsertMeta('name', 'twitter:description', meta.description);
    upsertMeta('name', 'twitter:image', meta.image);

    return undefined;
  }, [vacancy, heroImageUrl]);

  return null;
};

export default VacancySeoHead;
