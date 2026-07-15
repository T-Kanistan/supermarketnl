import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// Social crawlers (Facebook, WhatsApp, etc.) cannot run the React SPA and need the
// backend HTML renderer at /offers/:id and /vacancies/:id for Open Graph tags.
const SOCIAL_CRAWLER_UA =
  /facebookexternalhit|Facebot|Twitterbot|LinkedInBot|WhatsApp|Slackbot|TelegramBot|Discordbot|Pinterest|redditbot|Applebot|SkypeUriPreview|vkShare/i

const isSocialCrawlerRequest = (req) =>
  SOCIAL_CRAWLER_UA.test(req.headers['user-agent'] || '')

const isShareableDetailPath = (pathname) =>
  /^\/(offers|vacancies)\/[a-f0-9]{24}$/i.test(pathname)

const createShareProxy = (target) => ({
  target,
  changeOrigin: true,
  bypass(req) {
    const pathname = (req.url || '').split('?')[0]
    if (!isShareableDetailPath(pathname) || !isSocialCrawlerRequest(req)) {
      return req.url
    }
    return null
  },
})

// Local backend the dev/preview servers forward API calls to.
// Override with VITE_PROXY_TARGET when your backend runs elsewhere.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const proxyTarget = env.VITE_PROXY_TARGET || 'http://localhost:5000'

  const proxy = {
    '/api': { target: proxyTarget, changeOrigin: true },
    '/uploads': { target: proxyTarget, changeOrigin: true },
    '/offers': createShareProxy(proxyTarget),
    '/vacancies': createShareProxy(proxyTarget),
  }

  const siteUrl = String(env.VITE_SITE_URL || '').trim()
  const apiUrl = String(env.VITE_API_URL || '').trim()
  const isLocalHostUrl = (value) =>
    /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?(\/|$)/i.test(value)

  if (mode === 'production') {
    if (!siteUrl || isLocalHostUrl(siteUrl)) {
      throw new Error(
        'Production builds require VITE_SITE_URL to be your live HTTPS domain ' +
          '(e.g. https://raguwinswereldwinkel.nl). Do not use localhost.'
      )
    }
    if (apiUrl && isLocalHostUrl(apiUrl)) {
      throw new Error(
        'VITE_API_URL points at localhost, which would break the production site for visitors. ' +
          'Leave VITE_API_URL empty so the app uses same-origin /api (via Nginx).'
      )
    }
  }

  return {
    plugins: [react()],
    server: { proxy },
    preview: { proxy },
    build: {
      // Never leave npm packages as bare imports in the browser bundle.
      // A bare `from "fuse.js"` crashes the Food Corner page on production
      // because Nginx serves index.html for that path instead of the module.
      rollupOptions: {
        external: [],
      },
    },
  }
})
