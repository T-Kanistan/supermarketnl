import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { getSeoForPath } from '../seo/seoConfig';
import {
  BUSINESS,
  DEFAULT_OG_IMAGE,
  SITE_NAME,
  SITE_URL,
  buildCanonicalUrl,
} from '../seo/siteConfig';

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

const upsertJsonLd = (id, data) => {
  let script = document.getElementById(id);
  if (!script) {
    script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = id;
    document.head.appendChild(script);
  }
  script.textContent = JSON.stringify(data);
};

const removeJsonLd = (id) => {
  document.getElementById(id)?.remove();
};

const buildLocalBusinessSchema = () => ({
  '@context': 'https://schema.org',
  '@type': 'GroceryStore',
  name: BUSINESS.name,
  image: DEFAULT_OG_IMAGE,
  url: SITE_URL,
  telephone: BUSINESS.phone,
  email: BUSINESS.email,
  priceRange: '€€',
  address: {
    '@type': 'PostalAddress',
    streetAddress: BUSINESS.streetAddress,
    addressLocality: BUSINESS.addressLocality,
    postalCode: BUSINESS.postalCode,
    addressCountry: BUSINESS.addressCountry,
  },
  geo: {
    '@type': 'GeoCoordinates',
    latitude: BUSINESS.geo.latitude,
    longitude: BUSINESS.geo.longitude,
  },
  openingHoursSpecification: [
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      opens: '09:00',
      closes: '20:00',
    },
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: 'Sunday',
      opens: '12:00',
      closes: '19:00',
    },
  ],
  sameAs: [],
});

const SeoHead = () => {
  const { pathname } = useLocation();
  const seo = getSeoForPath(pathname);

  useEffect(() => {
    if (!seo) return undefined;

    const canonicalUrl = buildCanonicalUrl(pathname);
    const ogImage = seo.ogImage || DEFAULT_OG_IMAGE;

    document.title = seo.title;
    upsertMeta('name', 'description', seo.description);
    upsertMeta('name', 'author', SITE_NAME);
    upsertMeta('name', 'robots', seo.noindex ? 'noindex, nofollow' : 'index, follow');
    upsertMeta('name', 'theme-color', '#1d4ed8');

    upsertLink('canonical', canonicalUrl);
    upsertLink('alternate', canonicalUrl);

    upsertMeta('property', 'og:site_name', SITE_NAME);
    upsertMeta('property', 'og:title', seo.title);
    upsertMeta('property', 'og:description', seo.description);
    upsertMeta('property', 'og:image', ogImage);
    upsertMeta('property', 'og:url', canonicalUrl);
    upsertMeta('property', 'og:type', seo.ogType);
    upsertMeta('property', 'og:locale', 'en_NL');

    upsertMeta('name', 'twitter:card', 'summary_large_image');
    upsertMeta('name', 'twitter:title', seo.title);
    upsertMeta('name', 'twitter:description', seo.description);
    upsertMeta('name', 'twitter:image', ogImage);

    if (seo.includeLocalBusiness) {
      upsertJsonLd('json-ld-local-business', buildLocalBusinessSchema());
      upsertJsonLd('json-ld-website', {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: SITE_NAME,
        url: SITE_URL,
        potentialAction: {
          '@type': 'SearchAction',
          target: `${SITE_URL}/products?search={search_term_string}`,
          'query-input': 'required name=search_term_string',
        },
      });
    } else {
      removeJsonLd('json-ld-local-business');
      removeJsonLd('json-ld-website');
    }

    return undefined;
  }, [pathname, seo]);

  return null;
};

export default SeoHead;
