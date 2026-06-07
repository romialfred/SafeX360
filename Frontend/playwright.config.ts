/**
 * playwright.config.ts — Phase 10-B Frontend (Module Dosimetrie).
 *
 * Configuration Playwright pour les tests E2E du module Dosimetrie.
 *
 * <p><b>Pre-requis</b> :
 *  - L'application Frontend doit tourner sur http://localhost:5173 (vite dev).
 *  - Le backend Spring Boot doit tourner sur http://localhost:8080 avec une
 *    base de donnees seedee (V012__dosimetry_seed_kpi.sql + fixtures de test).
 *  - Un compte utilisateur de test avec privileges PCR doit exister
 *    (login/password fournis via variables d'environnement PW_USER / PW_PASS).
 *
 * <p><b>Installation locale</b> :
 *   npm install -D @playwright/test
 *   npx playwright install --with-deps chromium
 *
 * <p><b>Lancement</b> :
 *   npm run dev              # terminal 1 : front
 *   ./gradlew bootRun        # terminal 2 : back
 *   npx playwright test      # terminal 3 : tests E2E
 *
 * <p>Les tests sont volontairement organises par scenario metier dans
 * {@code e2e/dosimetry/}. Chaque fichier couvre un workflow complet de bout
 * en bout (creation worker -> dosimetre -> dose -> alerte -> case -> PDF).
 */

import { defineConfig, devices } from '@playwright/test';

/**
 * Voir https://playwright.dev/docs/test-configuration pour les options
 * detaillees. Les valeurs par defaut ici sont calibrees pour un environnement
 * local de dev (single browser, headless, retries 1).
 */
export default defineConfig({
    testDir: './e2e',
    /** Timeout par test : 60s — couvre les uploads PDF et les modales reactives. */
    timeout: 60 * 1000,
    /** Timeout des expect() : 10s — laisse le temps aux notifications. */
    expect: {
        timeout: 10 * 1000,
    },
    /** Empeche un .only() commit accidentel de figer la CI. */
    forbidOnly: !!process.env.CI,
    /** 1 retry pour absorber les flakes reseau (login, fetch initial). */
    retries: process.env.CI ? 2 : 1,
    /** Workers : 2 en local pour ne pas surcharger le backend Spring Boot. */
    workers: process.env.CI ? 1 : 2,
    /** Reporters : HTML + list dans la console. */
    reporter: [
        ['list'],
        ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ],

    use: {
        /** URL racine — override par PW_BASE_URL si besoin. */
        baseURL: process.env.PW_BASE_URL ?? 'http://localhost:5173',

        /** Headless par defaut — passer HEADED=1 pour debug visuel. */
        headless: process.env.HEADED !== '1',

        /** Trace activee uniquement sur premier retry pour ne pas exploser le disque. */
        trace: 'on-first-retry',

        /** Video enregistree uniquement en cas d'echec. */
        video: 'retain-on-failure',

        /** Screenshot en cas d'echec — utile pour debug visuel rapide. */
        screenshot: 'only-on-failure',

        /** Locale FR par defaut (le module est en francais). */
        locale: 'fr-FR',

        /** Timezone Europe/Paris (coherent avec les seeds de date). */
        timezoneId: 'Europe/Paris',
    },

    /** Un seul projet Chromium suffit pour le module Dosimetrie. */
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
    ],

    /**
     * Demarrage automatique du serveur de dev — desactive par defaut pour ne
     * pas conflitter avec une instance deja lancee. Activer en CI via
     * PW_AUTOSTART_DEV=1.
     */
    webServer:
        process.env.PW_AUTOSTART_DEV === '1'
            ? {
                  command: 'npm run dev',
                  url: 'http://localhost:5173',
                  reuseExistingServer: !process.env.CI,
                  timeout: 120 * 1000,
              }
            : undefined,
});
