import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [
        react(),
        VitePWA({
          registerType: 'autoUpdate',
          injectRegister: 'auto',
          manifest: false, // keep the hand-written public/manifest.json
          workbox: {
            globPatterns: ['**/*.{js,css,html,ico,png,svg,json,webmanifest}'],
            navigateFallback: '/index.html',
            runtimeCaching: [
              {
                // Tailwind is loaded from its CDN at runtime — cache it so the
                // installed app is styled offline.
                urlPattern: ({ url }) => url.origin === 'https://cdn.tailwindcss.com',
                handler: 'StaleWhileRevalidate',
                options: { cacheName: 'tailwind-cdn' },
              },
              {
                urlPattern: ({ url }) => url.origin === 'https://aistudiocdn.com',
                handler: 'StaleWhileRevalidate',
                options: { cacheName: 'aistudio-cdn' },
              },
            ],
          },
        }),
      ],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
