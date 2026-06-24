export const SITE_NAME = 'Wins Wereld Winkel';

export const SITE_URL =
  (import.meta.env.VITE_SITE_URL || 'https://wins-wereld-winkel.netlify.app').replace(/\/$/, '');

export const DEFAULT_OG_IMAGE = `${SITE_URL}/images/premium_supermarket_hero.png`;

export const BUSINESS = {
  name: 'Wins Wereld Winkel',
  streetAddress: 'Leeuwenstraat 36',
  postalCode: '1211 EV',
  addressLocality: 'Hilversum',
  addressCountry: 'NL',
  fullAddress: 'Leeuwenstraat 36, 1211 EV Hilversum',
  phone: '+31659046526',
  email: 'info@winswereldwinkel.nl',
  geo: {
    latitude: 52.2292,
    longitude: 5.1756,
  },
};

export const SITEMAP_ROUTES = [
  { path: '/', changefreq: 'weekly', priority: '1.0' },
  { path: '/products', changefreq: 'daily', priority: '0.9' },
  { path: '/food-corner', changefreq: 'daily', priority: '0.9' },
  { path: '/vacancies', changefreq: 'weekly', priority: '0.8' },
  { path: '/faq', changefreq: 'monthly', priority: '0.7' },
  { path: '/contact-us', changefreq: 'monthly', priority: '0.8' },
  { path: '/about-us', changefreq: 'monthly', priority: '0.8' },
  { path: '/offers', changefreq: 'weekly', priority: '0.7' },
  { path: '/terms', changefreq: 'yearly', priority: '0.3' },
  { path: '/privacy', changefreq: 'yearly', priority: '0.3' },
];

const normalizePath = (pathname) => {
  if (!pathname) return '/';
  const path = pathname.split('?')[0].replace(/\/$/, '') || '/';
  if (path === '/contact') return '/contact-us';
  if (path === '/about') return '/about-us';
  return path;
};

export const getCanonicalPath = normalizePath;

export const buildCanonicalUrl = (pathname) => `${SITE_URL}${normalizePath(pathname)}`;
