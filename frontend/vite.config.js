import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// Local backend the dev/preview servers forward API calls to.
// Override with VITE_PROXY_TARGET when your backend runs elsewhere.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const proxyTarget = env.VITE_PROXY_TARGET || 'http://localhost:5000'

  const proxy = {
    '/api': { target: proxyTarget, changeOrigin: true },
    '/uploads': { target: proxyTarget, changeOrigin: true },
  }

  return {
    plugins: [react()],
    server: { proxy },
    preview: { proxy },
  }
})
