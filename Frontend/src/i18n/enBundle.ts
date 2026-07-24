/**
 * Traductions ANGLAISES — chargées À LA DEMANDE.
 *
 * Ce module n'est JAMAIS importé statiquement : `i18n/index.ts` le charge par
 * `import()` dynamique la première fois que l'utilisateur passe en anglais. Vite
 * en fait donc un chunk séparé, retiré du bundle d'entrée. Le français, langue
 * par défaut de la plateforme (fallbackLng), reste embarqué et instantané —
 * l'immense majorité des sessions ne télécharge jamais ce fichier.
 */
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

/** Namespaces anglais, dans le même ordre que la déclaration `ns` d'i18n. */
const EN_RESOURCES: Record<string, Record<string, unknown>> = {
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
};

export default EN_RESOURCES;
