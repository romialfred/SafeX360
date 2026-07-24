/**
 * SafeX 360 — Setup react-i18next (LOT 44 — P0).
 *
 * Stratégie :
 *   • Tous les locales bundles import statique (pas de lazy loading)
 *   • Détection auto navigateur via i18next-browser-languagedetector
 *   • Fallback : FR (langue principale de la plateforme)
 *   • Persistance : localStorage clé `safex360-lang`
 *   • Namespaces séparés par module pour scalabilité
 *
 * Référentiel ISO : voir `src/i18n/glossary-iso.md`
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// === FR ===
import frCommon from './locales/fr/common.json';
import frNavigation from './locales/fr/navigation.json';
import frHse from './locales/fr/hse.json';
import frNonConformity from './locales/fr/nonConformity.json';
import frEmergency from './locales/fr/emergency.json';
import frModuleManager from './locales/fr/moduleManager.json';
import frDosimetry from './locales/fr/dosimetry.json';
import frBlast from './locales/fr/blast.json';
import frInspection from './locales/fr/inspection.json';
import frHome from './locales/fr/home.json';
import frIncidents from './locales/fr/incidents.json';
import frAdhoc from './locales/fr/adhoc.json';
import frAudits from './locales/fr/audits.json';
import frPpe from './locales/fr/ppe.json';
import frRisk from './locales/fr/risk.json';
import frCommunications from './locales/fr/communications.json';
import frCorrective from './locales/fr/corrective.json';

// === EN : chargé à la demande (voir ensureLanguageResources), pas ici ===

export const SUPPORTED_LANGUAGES = ['fr', 'en'] as const;
export type SupportedLanguage = typeof SUPPORTED_LANGUAGES[number];

export const LANGUAGE_LABELS: Record<SupportedLanguage, { label: string; flag: string; native: string }> = {
    fr: { label: 'French',  flag: '🇫🇷', native: 'Français' },
    en: { label: 'English', flag: '🇬🇧', native: 'English' },
};

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources: {
            fr: {
                common: frCommon,
                navigation: frNavigation,
                hse: frHse,
                nonConformity: frNonConformity,
                emergency: frEmergency,
                moduleManager: frModuleManager,
                dosimetry: frDosimetry,
                blast: frBlast,
                inspection: frInspection,
                home: frHome,
                incidents: frIncidents,
                adhoc: frAdhoc,
                audits: frAudits,
                ppe: frPpe,
                risk: frRisk,
                communications: frCommunications,
                corrective: frCorrective,
            },
            // EN absent au boot : enregistré à la demande par ensureLanguageResources.
        },
        // Indispensable avec des ressources partielles : sans cela i18next
        // considère qu'une langue « connue » (EN) est déjà complètement chargée
        // et n'accepterait pas l'ajout ultérieur des namespaces.
        partialBundledLanguages: true,
        fallbackLng: 'fr',
        supportedLngs: SUPPORTED_LANGUAGES as unknown as string[],

        defaultNS: 'common',
        ns: ['common', 'navigation', 'hse', 'nonConformity', 'emergency', 'moduleManager', 'dosimetry', 'blast', 'inspection', 'home', 'incidents', 'adhoc', 'audits', 'ppe', 'risk', 'communications', 'corrective'],

        detection: {
            // Ordre de détection : 1) localStorage, 2) navigator
            order: ['localStorage', 'navigator', 'htmlTag'],
            lookupLocalStorage: 'safex360-lang',
            caches: ['localStorage'],
            // Force FR pour les langues non supportées
            convertDetectedLanguage: (lng) => {
                const base = lng.split('-')[0].toLowerCase();
                return SUPPORTED_LANGUAGES.includes(base as SupportedLanguage) ? base : 'fr';
            },
        },

        interpolation: {
            escapeValue: false, // React échappe déjà par défaut
        },

        // En dev : avertir si une clé manque
        saveMissing: import.meta.env.DEV,
        missingKeyHandler: (lngs, ns, key) => {
            if (import.meta.env.DEV) {
                // eslint-disable-next-line no-console
                console.warn(`[i18n] missing key — lng=${lngs.join(',')} ns=${ns} key=${key}`);
            }
        },
    });

// ─── Chargement à la demande des langues non embarquées (EN) ──────────
// Le FR est embarqué (langue par défaut) ; les autres sont chargées par
// import() dynamique la première fois qu'on en a besoin. Idempotent : un
// second appel ne recharge rien.
const loadedLanguages = new Set<string>(['fr']);

/**
 * Garantit que les ressources de `lng` sont enregistrées AVANT de basculer
 * dessus — sinon l'IHM afficherait des clés brutes le temps du chargement.
 * À appeler avant tout `changeLanguage` vers une langue non-FR.
 */
export async function ensureLanguageResources(lng: string): Promise<void> {
    const base = (lng || '').split('-')[0].toLowerCase();
    if (base !== 'en' || loadedLanguages.has(base)) {
        return;
    }
    const { default: enResources } = await import('./enBundle');
    Object.entries(enResources).forEach(([ns, bundle]) => {
        // deep=true, overwrite=true : namespace complet, remplace un éventuel repli.
        i18n.addResourceBundle('en', ns, bundle, true, true);
    });
    loadedLanguages.add(base);
}

// Au boot : si la langue résolue (localStorage/navigateur) est déjà l'anglais,
// on charge son bundle puis on rafraîchit — l'utilisateur EN retrouve sa langue.
if ((i18n.resolvedLanguage || i18n.language || '').split('-')[0].toLowerCase() === 'en') {
    void ensureLanguageResources('en').then(() => i18n.changeLanguage('en'));
}

// ─── Sync <html lang="..."> avec la langue résolue ───────────────────
// Rigueur i18n (LOT 49) : la balise <html lang> sert pour l'accessibilité,
// la synthèse vocale (Web Speech) et certains styles CSS de localisation.
// On la synchronise au boot ET à chaque changement de langue pour éviter
// l'incohérence "sidebar FR + html lang=en" observée en prod.
const syncHtmlLang = (lng: string | undefined) => {
    if (typeof document === 'undefined' || !lng) return;
    const base = lng.split('-')[0].toLowerCase();
    if (SUPPORTED_LANGUAGES.includes(base as SupportedLanguage)) {
        document.documentElement.lang = base;
    }
};
syncHtmlLang(i18n.resolvedLanguage || i18n.language);
i18n.on('languageChanged', syncHtmlLang);

export default i18n;
