import { defineConfig } from 'vitest/config';
import type { Plugin } from 'vite';
import react from '@vitejs/plugin-react-swc';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

/**
 * Service worker « kill-switch » : se désenregistre lui-même, purge tous les
 * caches CacheStorage de l'origine puis recharge les onglets contrôlés.
 * Servi UNIQUEMENT par le dev server (voir devServiceWorkerKillSwitch).
 */
const SW_KILL_SWITCH = `self.addEventListener('install', function () { self.skipWaiting(); });
self.addEventListener('activate', function (event) {
  event.waitUntil((async function () {
    var keys = await caches.keys();
    await Promise.all(keys.map(function (k) { return caches.delete(k); }));
    await self.registration.unregister();
    var clients = await self.clients.matchAll({ type: 'window' });
    clients.forEach(function (c) { c.navigate(c.url); });
  })());
});`;

/**
 * Dev uniquement — neutralise un service worker résiduel sur localhost:517x
 * (ancien build preview SafeX, ou autre projet Vite ayant occupé le port).
 * Sans ça, le SW Workbox sert les scripts en CacheFirst (30 j) et mélange
 * des chunks périmés avec les modules HMR → page blanche, erreurs
 * « /@react-refresh does not provide an export » et « ws://localhost:undefined ».
 *
 *   1. Toute requête vers un nom de SW connu reçoit le kill-switch :
 *      le navigateur met à jour le SW enregistré, qui s'auto-détruit.
 *   2. index.html reçoit un script inline qui désenregistre les SW et purge
 *      les caches dès le parse, avant l'exécution des modules.
 */
function devServiceWorkerKillSwitch(): Plugin {
  return {
    name: 'safex-dev-sw-kill-switch',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = (req.url || '').split('?')[0];
        if (['/sw.js', '/dev-sw.js', '/service-worker.js', '/registerSW.js'].includes(url)) {
          res.setHeader('Content-Type', 'text/javascript');
          res.setHeader('Cache-Control', 'no-store');
          res.end(url === '/registerSW.js' ? '' : SW_KILL_SWITCH);
          return;
        }
        next();
      });
    },
    transformIndexHtml() {
      return [
        {
          tag: 'script',
          injectTo: 'head-prepend',
          children: `if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(function (regs) {
    var hadSw = regs.length > 0;
    Promise.all(regs.map(function (r) { return r.unregister(); }))
      .then(function () { return window.caches ? caches.keys() : []; })
      .then(function (keys) { return Promise.all(keys.map(function (k) { return caches.delete(k); })); })
      .then(function () {
        if (hadSw && !sessionStorage.getItem('safex-sw-purged')) {
          sessionStorage.setItem('safex-sw-purged', '1');
          location.reload();
        }
      });
  });
}`,
        },
      ];
    },
  };
}

/**
 * SafeX 360 — Vite configuration.
 *
 * LOT 40 Phase 5 — Performance + bundle optimization :
 *
 *   1. manualChunks : on découpe le bundle en chunks logiques pour
 *      réduire le bundle initial (était ~4.3 MB) et permettre un cache
 *      navigateur plus efficace par catégorie de dépendance.
 *
 *   2. chunkSizeWarningLimit : on remonte à 1500 KB pour silencer les
 *      warnings sur les chunks vendor partagés (Mantine + PrimeReact +
 *      Recharts génèrent ~1 MB chacun, c'est attendu).
 *
 *   3. assetsInlineLimit : on inline les assets < 4 KB (icônes, SVG)
 *      pour réduire les requêtes HTTP.
 */
export default defineConfig({
  plugins: [
    devServiceWorkerKillSwitch(),
    react(),
    tailwindcss(),
    // SafeX 360 Field — Service Worker pour la version mobile (PWA + APK
    // Capacitor). Strategie : prendre en cache l'app shell (JS/CSS/HTML) et
    // les images statiques. Les appels API REST utilisent un NetworkFirst
    // avec fallback cache (TTL 5 min sur GET /hns/*).
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'manifest.webmanifest'],
      manifestFilename: 'manifest.webmanifest',
      // On reutilise public/manifest.webmanifest existant — pas de re-genere
      manifest: false,
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        // Bundle JS principal ~4 MB → augmenter la limite a 8 MB pour precache PWA
        maximumFileSizeToCacheInBytes: 8 * 1024 * 1024,
        // Durcissement : purge les anciens precaches a chaque nouveau SW
        // (evite l'accumulation d'assets perimes et les melanges de versions).
        cleanupOutdatedCaches: true,
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [
          // Les routes API ne doivent jamais retomber sur index.html
          /^\/api/,
          /^\/hns/,
          /^\/hrms/,
        ],
        runtimeCaching: [
          // App shell : Cache First avec revalidation
          {
            urlPattern: ({ request }) => request.destination === 'document',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'safex-shell',
              networkTimeoutSeconds: 4,
              expiration: { maxEntries: 20, maxAgeSeconds: 7 * 24 * 3600 },
            },
          },
          // Assets statiques (JS, CSS, fonts) : Cache First
          {
            urlPattern: ({ request }) =>
              ['script', 'style', 'font'].includes(request.destination),
            handler: 'CacheFirst',
            options: {
              cacheName: 'safex-static',
              expiration: { maxEntries: 200, maxAgeSeconds: 30 * 24 * 3600 },
            },
          },
          // Images : Stale While Revalidate
          {
            urlPattern: ({ request }) => request.destination === 'image',
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'safex-images',
              expiration: { maxEntries: 100, maxAgeSeconds: 30 * 24 * 3600 },
            },
          },
          // GET /hns/* : NetworkFirst 5s puis fallback cache
          {
            urlPattern: ({ url }) =>
              url.pathname.startsWith('/hns/') || url.pathname.startsWith('/api/'),
            handler: 'NetworkFirst',
            method: 'GET',
            options: {
              cacheName: 'safex-api-get',
              networkTimeoutSeconds: 5,
              expiration: { maxEntries: 100, maxAgeSeconds: 5 * 60 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      // En dev : on n'enregistre pas le SW pour eviter de stale-cache pendant
      // les iterations Vite HMR (le SW intercepte les chunks).
      devOptions: { enabled: false },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  /**
   * Vitest config — Phase 10-B (tests utilitaires + composants Dosimetrie).
   *
   * environment "jsdom" pour les tests composants (testing-library).
   * Pas de setupFiles — les mocks sont locaux a chaque test.
   */
  test: {
    environment: 'jsdom',
    globals: false,
    include: ['src/**/*.test.{ts,tsx}'],
  },
  build: {
    chunkSizeWarningLimit: 1500,
    assetsInlineLimit: 4096,
    rollupOptions: {
      output: {
        // LOT 40 Phase 5 : on découpe react/mantine/recharts/redux/map en
        // chunks séparés. PrimeReact est exclu car son ESM contient des
        // dynamic imports optionnels (chart.js) qui cassent rollup.
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'mantine': [
            '@mantine/core',
            '@mantine/hooks',
            '@mantine/form',
            '@mantine/notifications',
            '@mantine/dates',
            '@mantine/modals',
          ],
          'charts': ['recharts'],
          'date-utils': ['dayjs'],
          'redux': ['@reduxjs/toolkit', 'react-redux'],
          'map': ['leaflet', 'react-leaflet'],
        },
      },
    },
  },
})
