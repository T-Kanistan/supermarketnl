import { writeFileSync, mkdirSync, readFileSync, existsSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const frontendRoot = resolve(__dirname, '..');
const publicDir = resolve(frontendRoot, 'public');

/** Minimal .env loader. Set `override` to replace already-defined keys. */
const loadEnvFile = (filePath, { override = false } = {}) => {
  if (!existsSync(filePath)) return;
  const text = readFileSync(filePath, 'utf8');
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (override || process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
};

const mode =
  process.env.NODE_ENV === 'production' || process.argv.includes('--production')
    ? 'production'
    : 'development';
loadEnvFile(resolve(frontendRoot, '.env'));
if (mode === 'production') {
  // Production file wins over local `.env` so localhost SITE_URL cannot leak.
  loadEnvFile(resolve(frontendRoot, '.env.production'), { override: true });
}

const isProduction = mode === 'production';
const rawSiteUrl = (process.env.VITE_SITE_URL || '').trim();
const isLocalSiteUrl = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?\/?$/i.test(rawSiteUrl);

if (isProduction && (!rawSiteUrl || isLocalSiteUrl)) {
  console.error(
    '[seo] VITE_SITE_URL must be your live HTTPS domain for production builds (e.g. https://raguwinswereldwinkel.nl).'
  );
  process.exit(1);
}

const SITE_URL = (rawSiteUrl || 'http://localhost:5173').replace(/\/$/, '');

const routes = [
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

const lastmod = new Date().toISOString().split('T')[0];

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routes
  .map(
    (route) => `  <url>
    <loc>${SITE_URL}${route.path}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>
`;

const robots = `User-agent: *
Allow: /

Disallow: /admin/
Disallow: /manager/
Disallow: /login
Disallow: /forgot-password
Disallow: /reset-password
Disallow: /careers/apply/

Sitemap: ${SITE_URL}/sitemap.xml
`;

mkdirSync(publicDir, { recursive: true });
writeFileSync(resolve(publicDir, 'sitemap.xml'), sitemap, 'utf8');
writeFileSync(resolve(publicDir, 'robots.txt'), robots, 'utf8');

console.log(`[seo] Generated sitemap.xml and robots.txt for ${SITE_URL}`);
