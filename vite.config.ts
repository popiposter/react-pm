import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import { TanStackRouterVite } from '@tanstack/router-plugin/vite';

const appBasePath = process.env.VITE_APP_BASE_PATH || '/';

// https://vitejs.dev/config/
export default defineConfig({
  base: appBasePath,
  plugins: [
    TanStackRouterVite({
      target: 'react',
      routesDirectory: './src/routes',
    }),
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: {
        enabled: false // Enable only for production
      },
      manifest: {
        name: 'Проектные табели',
        short_name: 'Табели',
        description: 'Offline-first приложение для учета рабочего времени',
        theme_color: '#ffffff',
        start_url: appBasePath,
        scope: appBasePath,
        icons: [
          {
            src: 'src/assets/icon.svg',
            sizes: '192x192',
            type: 'image/svg+xml'
          },
          {
            src: 'src/assets/icon.svg',
            sizes: '512x512',
            type: 'image/svg+xml'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,wasm,png,jpg,jpeg,svg}'],
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.destination === 'document',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'html-cache',
            }
          },
          {
            urlPattern: ({ request }) => request.destination === 'script' || request.destination === 'style',
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'static-resources',
            }
          },
          {
            urlPattern: ({ request }) => request.destination === 'image',
            handler: 'CacheFirst',
            options: {
              cacheName: 'images',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 30 * 24 * 60 * 60 // 30 days
              }
            }
          }
        ]
      }
    })
  ],
  server: {
    port: 3000
  }
});
