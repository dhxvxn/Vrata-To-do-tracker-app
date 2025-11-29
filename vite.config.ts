// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react' // remove if not using React
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

export default defineConfig({
  base: './', // <- critical: use relative assets so GitHub Pages subpath works
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate', // auto-update service worker
      includeAssets: ['favicon.ico', 'robots.txt', 'icons/*'],
      manifest: {
        name: 'Vrata To-do tracker',
        short_name: 'Vrata',
        start_url: './index.html', // relative
        scope: './',               // relative
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#ffffff',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json}'],
        navigateFallback: './index.html', // SPA fallback for navigation
      },
      devOptions: {
        enabled: false // disable PWA dev service worker when using `vite dev`
      }
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  }
})

