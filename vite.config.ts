import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { resolveSiteOrigin, scrapeAaaGasPrice } from './lib/aaa/scrapeGasPrice'

function aaaGasApiPlugin(): Plugin {
  const handleAaaGasPrice = async (
    req: import('http').IncomingMessage,
    res: import('http').ServerResponse,
    next: () => void,
  ) => {
    if (req.url !== '/api/aaa-gas-price') {
      next()
      return
    }

    try {
      const siteOrigin = resolveSiteOrigin(
        req.headers.referer,
        req.headers.host,
        undefined,
        req.headers['x-site-origin'],
      )
      const price = await scrapeAaaGasPrice(siteOrigin)
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({ price }))
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to scrape AAA gas price'
      res.statusCode = 500
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({ error: message }))
    }
  }

  return {
    name: 'aaa-gas-api',
    configureServer(server) {
      server.middlewares.use(handleAaaGasPrice)
    },
    configurePreviewServer(server) {
      server.middlewares.use(handleAaaGasPrice)
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), aaaGasApiPlugin()],
  server: {
    proxy: {
      '/kalshi-api': {
        target: 'https://external-api.kalshi.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/kalshi-api/, ''),
      },
    },
  },
  preview: {
    proxy: {
      '/kalshi-api': {
        target: 'https://external-api.kalshi.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/kalshi-api/, ''),
      },
    },
  },
})
