import { defineConfig } from 'vitest/config';
import type { Plugin } from 'vite';
import react from '@vitejs/plugin-react-swc';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import type { ManifestTransform } from 'workbox-build';
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
 * Repli de navigation du Service Worker : on precache l'app shell sous `/`
 * plutot que sous `index.html`.
 *
 * `cleanUrls` (vercel.json) repond 308 vers `/` pour `/index.html`. Or le repli
 * de navigation est parfois recupere par le RESEAU (precache absent apres un
 * deploiement) : la reponse porte alors `redirected = true`, ce que le
 * navigateur refuse pour une navigation -> ERR_FAILED intermittent a
 * l'ouverture de la Salle de Crise. `/` est l'URL canonique : 200, jamais de
 * redirection, sur le chemin cache comme sur le chemin reseau.
 */
const precacheShellAtRoot: ManifestTransform = (entries) => ({
  manifest: entries.map((entry) => (entry.url === 'index.html' ? { ...entry, url: '/' } : entry)),
  warnings: [],
});

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
    // Capacitor). Strategie : mettre en cache uniquement l'app shell
    // (JS/CSS/HTML) et les images statiques. Les API authentifiees ne sont
    // jamais placees dans CacheStorage ; l'offline metier passe par IndexedDB.
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'manifest.webmanifest'],
      manifestFilename: 'manifest.webmanifest',
      // On reutilise public/manifest.webmanifest existant — pas de re-genere
      manifest: false,
      workbox: {
        // Le précache reste limité au document d'amorçage. Les chunks et médias
        // réellement utilisés sont ajoutés aux caches runtime à la première visite,
        // ce qui évite de transférer ~34 MiB sur les réseaux terrain contraints.
        globPatterns: ['index.html'],
        maximumFileSizeToCacheInBytes: 512 * 1024,
        // Durcissement : purge les anciens precaches a chaque nouveau SW
        // (evite l'accumulation d'assets perimes et les melanges de versions).
        cleanupOutdatedCaches: true,

        // ⚠️ LE REPLI DE NAVIGATION NE DOIT JAMAIS POINTER SUR UNE URL QUI REDIRIGE.
        //
        // Régression du 2026-08-05, intermittente et récurrente (déjà vue le 21/07
        // par un autre chemin) : « a redirected response was used for a request
        // whose redirect mode is not "follow" » à l'ouverture de la Salle de Crise.
        //
        // Mécanisme : la NavigationRoute est liée à l'URL de repli. Quand l'entrée
        // de précache est présente, elle est servie depuis le cache — tout va bien.
        // Quand elle MANQUE (fenêtre suivant un déploiement, éviction de stockage),
        // Workbox se rabat sur un `fetch()` de cette URL. Or `cleanUrls` (vercel.json)
        // répond **308 vers `/`** pour `/index.html`. La réponse porte alors
        // `redirected = true`, ce que le navigateur REFUSE pour une navigation :
        // ERR_FAILED. D'où l'intermittence, et le Ctrl+Maj+R qui « répare »
        // (le rechargement forcé court-circuite le Service Worker).
        //
        // Seule la Salle de Crise est touchée car c'est le seul écran ouvert par
        // `window.open` : les autres navigations sont côté client et ne passent
        // jamais par la NavigationRoute.
        //
        // On bascule donc le repli sur `/`, URL canonique qui répond 200 sans
        // redirection — sur les DEUX chemins : servi depuis le précache, ou
        // récupéré du réseau si le précache manque. `manifestTransforms` réécrit
        // l'entrée de précache en conséquence, sinon `createHandlerBoundToURL('/')`
        // ne trouverait rien à servir.
        // Invariant verrouillé par src/governance/serviceWorkerNavigation.test.ts.
        manifestTransforms: [precacheShellAtRoot],
        navigateFallback: '/',
        navigateFallbackDenylist: [
          // Les routes API ne doivent jamais retomber sur index.html
          /^\/api/,
          /^\/hns/,
          /^\/hrms/,
          // Le mockup HTML monofichier Analytics est autonome : le SW ne
          // doit PAS le remplacer par la SPA SafeX (sinon Babel standalone
          // essaie de transformer le HTML de la SPA et crashe).
          /^\/safex-analytics/,
        ],
        runtimeCaching: [
          // NB : PAS de runtimeCaching sur les navigations (request.destination
          // === 'document'). NetworkFirst faisait un fetch() dont la réponse
          // pouvait être « redirected: true » (rewrite/redirect serveur), ce que
          // le navigateur REFUSE pour une navigation (« a redirected response
          // was used for a request whose redirect mode is not follow »),
          // provoquant un ERR_FAILED à l'ouverture (ex. Salle de Crise en
          // nouvelle fenêtre). Les navigations sont servies par navigateFallback
          // (index.html PRÉCACHÉ, jamais redirigé), tenu à jour par autoUpdate.
          //
          // ⚠️ RÈGLE ABSOLUE (régression du 02/08) : ces routes ne matchent QUE
          // le MÊME ORIGINE. Un fetch() émis DEPUIS le Service Worker est régi
          // par la CSP servie avec /sw.js — la CSP GLOBALE — et non par celle de
          // la page. En interceptant des scripts tiers, le SW les refetchait
          // depuis le worker, où `connect-src` ne les autorise pas : « Refused to
          // connect… » → no-response → net::ERR_FAILED. C'est ce qui tuait
          // /safex-analytics (React/Recharts/D3/Tailwind/Babel en CDN) de façon
          // « aléatoire » : cassé quand le SW contrôlait l'onglet, OK sinon.
          // Le correctif f588cec (fonts.googleapis en connect-src) traitait le
          // symptôme hôte par hôte ; on traite ici la cause : le SW ne touche
          // plus à ce qui ne vient pas de notre origine.
          //
          // Assets statiques de MÊME ORIGINE (JS, CSS, fonts) : Cache First.
          {
            urlPattern: ({ request, sameOrigin, url }) =>
              sameOrigin
              && ['script', 'style', 'font'].includes(request.destination)
              // La page Analytics est une appli autonome (public/safex-analytics)
              // servie telle quelle : le SW ne doit ni l'intercepter ni la cacher.
              && !url.pathname.startsWith('/safex-analytics'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'safex-static-v2',
              expiration: { maxEntries: 200, maxAgeSeconds: 30 * 24 * 3600 },
              // ⚠️ Anti-empoisonnement (régression du 02/08) : un chunk lazy dont
              // le hash n'existe plus retombait sur la réécriture SPA de Vercel,
              // qui répondait 200 + text/html. `response.ok` étant vrai, CacheFirst
              // mettait CETTE PAGE HTML en cache SOUS L'URL DU .js, pour 30 jours.
              // Le chunk restait alors définitivement cassé (« Salle de Crise »
              // lazy-loadée), y compris après redéploiement — d'où les échecs
              // aléatoires qui revenaient après un vidage de cache.
              // On refuse donc de mettre en cache toute réponse dont le type ne
              // correspond pas à ce qui a été demandé.
              cacheableResponse: { statuses: [200] },
              plugins: [
                {
                  cacheWillUpdate: async ({ request, response }) => {
                    const type = (response.headers.get('content-type') || '').toLowerCase();
                    if (type.includes('text/html') && request.destination !== 'document') return null;
                    return response;
                  },
                },
              ],
            },
          },
          // Images de MÊME ORIGINE : Stale While Revalidate.
          // (Les images tierces — tuiles de carte, avatars distants — passent en
          // direct : le SW n'a pas à les refetcher sous sa propre CSP.)
          {
            urlPattern: ({ request, sameOrigin, url }) =>
              sameOrigin
              && request.destination === 'image'
              && !url.pathname.startsWith('/safex-analytics'),
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'safex-images-v2',
              expiration: { maxEntries: 100, maxAgeSeconds: 30 * 24 * 3600 },
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
    manifest: true,
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
