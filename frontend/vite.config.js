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

  return {
    plugins: [react()],
    server: { proxy },
    preview: { proxy },
  }
})
