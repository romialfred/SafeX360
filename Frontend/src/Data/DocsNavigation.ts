import type { DocNavSection } from '../components/UtilityComp/DocsShell';

/**
 * SafeX 360 — Arborescence de navigation de la documentation.
 *
 * Source de vérité unique pour la sidebar du module Centre de connaissances.
 * Ajouter ici tout nouvel article.
 *
 * Convention :
 *   - sections : grandes catégories (Démarrage, Modules métier, Référence ISO, Technique)
 *   - items : articles individuels (id unique pour le scrollspy/active state)
 *   - to : route React (ouvre l'article correspondant)
 */

export const DOCS_NAVIGATION: DocNavSection[] = [
    {
        id: 'getting-started',
        label: 'Démarrage',
        items: [
            { id: 'intro',             label: 'Introduction',           to: '/how-to' },
            { id: 'first-login',       label: 'Première connexion',     to: '/how-to#first-login' },
            { id: 'platform-overview', label: 'Vue d\'ensemble',        to: '/features-overview' },
            { id: 'concepts-hse',      label: 'Concepts clés HSE',      to: '/how-to#concepts-hse' },
        ],
    },
    {
        id: 'modules-business',
        label: 'Modules métier',
        items: [
            { id: 'incidents-module',        label: 'Gestion des incidents',         to: '/how-to#incidents-module' },
            { id: 'audits-module',           label: 'Audits & inspections',          to: '/how-to#audits-module' },
            { id: 'corrective-actions',      label: 'Actions correctives',           to: '/how-to#corrective-actions' },
            { id: 'risks-module',            label: 'Gestion des risques',           to: '/how-to#risks-module' },
            { id: 'ppe-module',              label: 'Équipements de protection',     to: '/how-to#ppe-module' },
            { id: 'compliance-module',       label: 'Conformité réglementaire',      to: '/how-to#compliance-module' },
            { id: 'communications-module',   label: 'Communication HSE',             to: '/how-to#communications-module' },
            { id: 'reports-module',          label: 'Rapports & analytics',          to: '/how-to#reports-module' },
        ],
    },
    {
        id: 'iso-reference',
        label: 'Référence ISO',
        items: [
            { id: 'iso-mapping',       label: 'Cartographie ISO',         to: '/iso-mapping', badge: 'Nouveau' },
            { id: 'iso-45001',         label: 'ISO 45001 — SST',          to: '/iso-documents' },
            { id: 'iso-14001',         label: 'ISO 14001 — Environnement', to: '/iso-documents' },
            { id: 'iso-9001',          label: 'ISO 9001 — Qualité',       to: '/iso-documents' },
            { id: 'iso-19011',         label: 'ISO 19011 — Audit',        to: '/iso-documents' },
            { id: 'iso-31000',         label: 'ISO 31000 — Risque',       to: '/iso-documents' },
        ],
    },
    {
        id: 'technical',
        label: 'Documentation technique',
        items: [
            { id: 'architecture',      label: 'Architecture',             to: '/technical-docs' },
            { id: 'api-reference',     label: 'Référence API',            to: '/technical-docs#api-reference' },
            { id: 'data-model',        label: 'Modèle de données',        to: '/technical-docs#data-model' },
            { id: 'auth-security',     label: 'Authentification & sécurité', to: '/technical-docs#auth-security' },
            { id: 'integrations',      label: 'Intégrations',             to: '/technical-docs#integrations' },
            { id: 'work-process',      label: 'Processus métier',         to: '/process-docs' },
        ],
    },
];
