import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const aaaGasProxy = {
  target: 'https://gasprices.aaa.com',
  changeOrigin: true,
  rewrite: (path: string) => path.replace(/^\/aaa-gas/, ''),
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/kalshi-api': {
        target: 'https://external-api.kalshi.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/kalshi-api/, ''),
      },
      '/aaa-gas': aaaGasProxy,
    },
  },
  preview: {
    proxy: {
      '/kalshi-api': {
        target: 'https://external-api.kalshi.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/kalshi-api/, ''),
      },
      '/aaa-gas': aaaGasProxy,
    },
  },
})
