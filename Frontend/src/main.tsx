import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';

// LOT 44 — Setup i18n (doit être importé avant App pour init avant le render)
import './i18n';

import { MantineProvider } from '@mantine/core';
import { ModalsProvider } from '@mantine/modals';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MantineProvider>
      <ModalsProvider>
        <App />
      </ModalsProvider>
    </MantineProvider>
  </StrictMode>
);

// ─────────────────────────────────────────────────────────────────────────────
// Durcissement PWA — auto-rafraîchissement à chaque déploiement
// ─────────────────────────────────────────────────────────────────────────────
// Le Service Worker (Workbox, registerType:'autoUpdate' → skipWaiting +
// clientsClaim) précache l'app. Sans ce code, une nouvelle version n'apparaît
// qu'après vidage manuel du cache. Ici :
//   • dès qu'un NOUVEAU SW prend le contrôle (= nouveau déploiement), on recharge
//     la page UNE fois pour servir la dernière version ;
//   • on ignore la toute première prise de contrôle (aucune version précédente)
//     pour ne pas recharger inutilement à la première visite ;
//   • on vérifie une nouvelle version toutes les 60 s (onglet resté ouvert).
// Désactivé en dev (le kill-switch de vite.config gère les SW résiduels locaux).
if (!import.meta.env.DEV && 'serviceWorker' in navigator) {
  const hadController = navigator.serviceWorker.controller != null;
  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hadController || refreshing) return;
    refreshing = true;
    window.location.reload();
  });
  navigator.serviceWorker.ready
    .then((reg) => {
      setInterval(() => { reg.update().catch(() => undefined); }, 60_000);
    })
    .catch(() => undefined);

  // Purge des caches runtime de la GÉNÉRATION PRÉCÉDENTE (régression du 02/08).
  // `cleanupOutdatedCaches` de Workbox ne nettoie que les PRÉcaches : les caches
  // runtime `safex-static` / `safex-images` survivaient à une mise à jour du SW.
  // Or ils pouvaient contenir la page HTML de repli SPA stockée sous l'URL d'un
  // chunk .js — un poison qui serait resté 30 jours malgré le correctif. Les
  // nouveaux caches sont suffixés `-v2` ; on supprime ici les anciens, une fois.
  if (window.caches) {
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((k) => k === 'safex-static' || k === 'safex-images').map((k) => caches.delete(k)),
      ))
      .catch(() => undefined);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Filet de sécurité « chunk périmé » — auto-réparation
// ─────────────────────────────────────────────────────────────────────────────
// Une page ouverte avant un déploiement référence des chunks lazy dont le hash
// n'existe plus. Le chargement échoue et l'écran concerné (typiquement la Salle
// de Crise, lazy-loadée et ouverte dans un NOUVEL onglet) reste bloqué.
//
// Vite n'émet `vite:preloadError` que pour SES preloads : un `import()` qui
// échoue au fetch, un <script type="module"> ou un modulepreload en erreur ne
// déclenchent RIEN. On couvre donc les trois voies, sinon l'auto-réparation ne
// s'arme jamais dans le cas réel.
//
// Escalade en deux temps, pour ne jamais rester coincé :
//   1er incident  → purge du cache SW des assets + mise à jour du SW + reload ;
//   2e  incident  → désinscription du SW (l'index précaché lui-même est suspect)
//                   + purge totale + reload. Au-delà, on n'insiste plus.
{
  const KEY = 'safex:chunk-recovery';
  let recovering = false;

  const purgeAndReload = async () => {
    if (recovering) return;
    recovering = true;
    const attempt = Number(sessionStorage.getItem(KEY) || '0') + 1;
    if (attempt > 2) return; // on ne boucle pas : l'erreur n'est pas un chunk périmé
    sessionStorage.setItem(KEY, String(attempt));
    try {
      if (window.caches) {
        const keys = await caches.keys();
        await Promise.all(
          keys
            .filter((k) => (attempt >= 2 ? true : k.startsWith("safex-")))
            .map((k) => caches.delete(k)),
        );
      }
      if ('serviceWorker' in navigator) {
        const reg = await navigator.serviceWorker.getRegistration();
        if (reg) await (attempt >= 2 ? reg.unregister() : reg.update());
      }
    } catch {
      /* la récupération ne doit jamais empêcher le rechargement */
    }
    window.location.reload();
  };

  // Volontairement ÉTROIT : uniquement les messages d'échec de chargement de
  // module (Chrome / Firefox / Safari). Un « Failed to fetch » générique n'en
  // fait PAS partie — sinon la moindre coupure réseau sur un appel API
  // déclencherait une purge + un rechargement intempestifs.
  const looksLikeStaleChunk = (msg: string) =>
    /dynamically imported module|Importing a module script failed|Failed to load module script/i.test(msg);

  // 1) Preloads Vite.
  window.addEventListener('vite:preloadError', () => { void purgeAndReload(); });

  // 2) import() rejeté (React.lazy) — non couvert par vite:preloadError.
  window.addEventListener('unhandledrejection', (e) => {
    const msg = String((e.reason && (e.reason.message || e.reason)) || '');
    if (looksLikeStaleChunk(msg)) void purgeAndReload();
  });

  // 3) <script> / <link rel=modulepreload> en erreur : pas d'exception JS, mais
  //    un event `error` sur l'élément — capturé en phase de capture (il ne bulle pas).
  window.addEventListener('error', (e) => {
    const el = e.target as HTMLElement | null;
    if (!el || el === (window as unknown as HTMLElement)) return;
    const tag = el.tagName;
    if (tag !== 'SCRIPT' && tag !== 'LINK') return;
    const src = (el as HTMLScriptElement).src || (el as HTMLLinkElement).href || '';
    if (src.includes('/assets/')) void purgeAndReload();
  }, true);

  // Une session qui tient 8 s sans incident réarme le compteur.
  window.addEventListener('load', () => {
    setTimeout(() => sessionStorage.removeItem(KEY), 8000);
  });
}
