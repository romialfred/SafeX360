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
}

// Chunk périmé après un déploiement : une page ouverte avant le déploiement
// référence des chunks lazy dont le hash n'existe plus → « Failed to fetch
// dynamically imported module » à la navigation. Vite émet `vite:preloadError` ;
// on recharge UNE fois pour récupérer l'index + les chunks à jour. Garde-fou
// sessionStorage pour ne pas boucler si le rechargement ne résout pas.
window.addEventListener('vite:preloadError', () => {
  const KEY = 'safex:chunk-reloaded';
  if (sessionStorage.getItem(KEY)) return;
  sessionStorage.setItem(KEY, '1');
  window.location.reload();
});
// Une navigation réussie efface le garde-fou (prochain incident → 1 reload permis).
window.addEventListener('load', () => {
  setTimeout(() => sessionStorage.removeItem('safex:chunk-reloaded'), 8000);
});
