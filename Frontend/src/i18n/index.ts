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

// === EN ===
import enCommon from './locales/en/common.json';
import enNavigation from './locales/en/navigation.json';
import enHse from './locales/en/hse.json';
import enNonConformity from './locales/en/nonConformity.json';
import enEmergency from './locales/en/emergency.json';
import enModuleManager from './locales/en/moduleManager.json';
import enDosimetry from './locales/en/dosimetry.json';
import enBlast from './locales/en/blast.json';
import enInspection from './locales/en/inspection.json';
import enHome from './locales/en/home.json';
import enIncidents from './locales/en/incidents.json';
import enAdhoc from './locales/en/adhoc.json';
import enAudits from './locales/en/audits.json';
import enPpe from './locales/en/ppe.json';
import enRisk from './locales/en/risk.json';
import enCommunications from './locales/en/communications.json';
import enCorrective from './locales/en/corrective.json';

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
            en: {
                common: enCommon,
                navigation: enNavigation,
                hse: enHse,
                nonConformity: enNonConformity,
                emergency: enEmergency,
                moduleManager: enModuleManager,
                dosimetry: enDosimetry,
                blast: enBlast,
                inspection: enInspection,
                home: enHome,
                incidents: enIncidents,
                adhoc: enAdhoc,
                audits: enAudits,
                ppe: enPpe,
                risk: enRisk,
                communications: enCommunications,
                corrective: enCorrective,
            },
        },
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
