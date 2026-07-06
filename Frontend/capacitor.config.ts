/**
 * Configuration Capacitor — SafeX 360 Field (version Android terrain).
 *
 * Cible : techniciens HSE en environnement minier (souvent hors ligne,
 * conditions difficiles, smartphones bas-de-gamme). Optimisations :
 *   - WebView Chrome system (mises a jour Play Store)
 *   - androidScheme HTTPS uniquement (certificate pinning possible)
 *   - SplashScreen sobre, court (300 ms) — pas de pub
 *   - StatusBar adaptee au theme du module (cyan inspections, rouge SOS)
 *   - Bundle ID inverse-domain (com.safex360.field)
 *
 * Document de reference : MOBILE_AUDIT.md
 */
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
    appId: 'com.safex360.hse',
    appName: 'SafeX 360 : HSE',
    webDir: 'dist',
    // Ne pas inclure le bundler de developpement dans l'APK
    bundledWebRuntime: false,

    server: {
        // En production le contenu est embarque dans l'APK (file://).
        // Pendant le dev, set CAP_SERVER_URL=https://192.168.x.x:3000 dans
        // l'env pour pointer vers le serveur Vite du poste de travail.
        androidScheme: 'https',
        cleartext: false, // refuse HTTP non chiffre
        url: process.env.CAP_SERVER_URL || undefined,
    },

    android: {
        // Forcer WebView system (Chrome update via Play Store)
        webContentsDebuggingEnabled: process.env.NODE_ENV !== 'production',
        // Stockage local persistant entre versions
        allowMixedContent: false,
        // Permet l'enregistrement de la position GPS en arriere-plan brief
        // (uniquement pendant un SOS en cours, geofencing T-10 tir).
        backgroundColor: '#FAF8F3',
    },

    plugins: {
        SplashScreen: {
            launchShowDuration: 300,
            backgroundColor: '#0E7490', // cyan-700, raccord identite SafeX
            androidSplashResourceName: 'splash',
            splashFullScreen: false,
            splashImmersive: false,
            showSpinner: false,
        },
        StatusBar: {
            // Configuration runtime via le hook useStatusBar() par ecran
            // (cyan home, rouge SOS, amber Blast, etc.). Init en mode clair.
            style: 'LIGHT',
            backgroundColor: '#0E7490',
        },
        LocalNotifications: {
            smallIcon: 'ic_stat_notification',
            iconColor: '#0E7490',
            sound: 'siren.wav',
        },
        PushNotifications: {
            presentationOptions: ['badge', 'sound', 'alert'],
        },
        Camera: {
            // Compression cote client pour ne pas saturer la 3G du puits
            // (typique : 1024 px max, qualite 70%, jpeg).
            saveToGallery: false,
        },
        Geolocation: {
            // Permissions exigees au runtime (POSITION_PRECISE pour SOS)
            permissions: ['location'],
        },
    },
};

export default config;
