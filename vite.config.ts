import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';
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
    svgr(),
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
        theme_color: '#0f172a',
        background_color: '#020617',
        display: 'standalone',
        orientation: 'portrait',
        start_url: appBasePath,
        scope: appBasePath,
        icons: [
          {
            src: 'icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ],
        screenshots: [
          {
            src: 'screenshot-desktop.png',
            sizes: '1280x720',
            type: 'image/png',
            form_factor: 'wide',
            label: 'Журнал табелей и demo onboarding'
          },
          {
            src: 'screenshot-mobile.png',
            sizes: '720x1280',
            type: 'image/png',
            label: 'Мобильный сценарий редактора табеля'
          }
        ],
        shortcuts: [
          {
            name: 'Табели',
            short_name: 'Табели',
            description: 'Открыть журнал табелей',
            url: `${appBasePath}timesheets`,
            icons: [
              {
                src: 'icon-192.png',
                sizes: '192x192',
                type: 'image/png'
              }
            ]
          },
          {
            name: 'Табель на сегодня',
            short_name: 'Логин',
            description: 'Открыть экран входа в демо',
            url: `${appBasePath}login`,
            icons: [
              {
                src: 'icon-192.png',
                sizes: '192x192',
                type: 'image/png'
              }
            ]
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
