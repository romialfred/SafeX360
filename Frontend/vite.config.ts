import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

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
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
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
