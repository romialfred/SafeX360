/**
 * Cartographie clauses ISO ↔ modules SafeX 360.
 *
 * Source de vérité unique pour :
 *  - La page /compliance/iso-mapping (vue tableau + vue module)
 *  - Les badges ISO affichés dans la sidebar et les en-têtes de modules
 *  - Les rapports de conformité générés depuis le module Rapports
 *
 * Format conçu pour permettre :
 *  - une vue "ISO → modules" (quels modules couvrent telle clause)
 *  - une vue "module → ISO" (quelles clauses sont couvertes par tel module)
 *  - un export tabulaire pour audits ISO 19011 (auditeur externe).
 *
 * Les références de clauses sont les codes officiels des normes ISO
 * (ex : "6.1.2" = identification des dangers dans ISO 45001:2018).
 */

export type IsoStandardCode =
    | 'ISO 45001'   // SST — Santé Sécurité au Travail
    | 'ISO 14001'   // Environnement
    | 'ISO 9001'    // Qualité
    | 'ISO 19011'   // Lignes directrices audit
    | 'ISO 31000';  // Management du risque

export interface IsoStandard {
    code: IsoStandardCode;
    fullName: string;
    year: number;
    color: string; // tailwind text color suffix (ex 'teal-700')
}

export const ISO_STANDARDS: IsoStandard[] = [
    {
        code: 'ISO 45001',
        fullName: "Systèmes de management de la santé et de la sécurité au travail",
        year: 2018,
        color: 'red-700',
    },
    {
        code: 'ISO 14001',
        fullName: "Systèmes de management environnemental",
        year: 2015,
        color: 'emerald-700',
    },
    {
        code: 'ISO 9001',
        fullName: "Systèmes de management de la qualité",
        year: 2015,
        color: 'blue-700',
    },
    {
        code: 'ISO 19011',
        fullName: "Lignes directrices pour l'audit des systèmes de management",
        year: 2018,
        color: 'indigo-700',
    },
    {
        code: 'ISO 31000',
        fullName: "Management du risque — principes et lignes directrices",
        year: 2018,
        color: 'amber-700',
    },
];

export interface IsoClause {
    code: string;          // ex "6.1.2"
    standard: IsoStandardCode;
    title: string;
    /** Modules SafeX (ids dans Sidebar.menuItems) qui couvrent cette clause. */
    coveredBy: SafeXModuleId[];
}

export type SafeXModuleId =
    | 'dashboard'
    | 'incidents'
    | 'audits'
    | 'corrective-actions'
    | 'risks'
    | 'ppe'
    | 'compliance'
    | 'communication'
    | 'planning'
    | 'reports'
    | 'knowledge'
    | 'preventive-activities'
    | 'investigations'
    | 'monitoring';

export interface SafeXModule {
    id: SafeXModuleId;
    label: string;
    routes: string[];      // routes principales
    description: string;
}

export const SAFEX_MODULES: SafeXModule[] = [
    { id: 'dashboard',             label: 'Tableau de bord HSE',     routes: ['/'],                          description: 'Vue agrégée des KPI HSE de la mine' },
    { id: 'incidents',             label: 'Incidents & accidents',   routes: ['/incidents'],                 description: 'Déclaration, suivi et clôture des événements' },
    { id: 'audits',                label: 'Audits & inspections',    routes: ['/audits'],                    description: 'Planification, exécution et reporting des audits' },
    { id: 'corrective-actions',    label: 'Actions correctives',     routes: ['/corrective-actions'],        description: 'Suivi des actions issues d\'incidents et d\'audits' },
    { id: 'risks',                 label: 'Gestion des risques',     routes: ['/risks'],                     description: 'Identification, évaluation et traitement' },
    { id: 'ppe',                   label: 'EPI',                     routes: ['/ppe-monitoring'],            description: 'Dotation, suivi et remplacement des EPI' },
    { id: 'compliance',            label: 'Conformité réglementaire',routes: ['/compliance'],                description: "Statut des obligations légales et certificats" },
    { id: 'communication',         label: 'Communication sécurité',  routes: ['/communications'],            description: 'Causeries, animations, communiqués HSE' },
    { id: 'planning',              label: 'Planning HSE',            routes: ['/planning'],                  description: 'Calendrier des activités HSE' },
    { id: 'reports',               label: 'Rapports & analytics',    routes: ['/reports'],                   description: 'Rapports périodiques et tableaux de bord' },
    { id: 'knowledge',             label: "Centre de connaissances", routes: ['/how-to', '/iso-documents'],  description: 'Documentation, procédures, ISO docs' },
    { id: 'preventive-activities', label: 'Activités préventives',   routes: ['/preventive-activities'],     description: 'Inspections, tournées, sensibilisations' },
    { id: 'investigations',        label: 'Investigations',          routes: ['/investigations'],            description: "Enquêtes approfondies post-événement" },
    { id: 'monitoring',            label: 'Surveillance',            routes: ['/monitoring'],                description: 'Plans d\'actions de surveillance' },
];

// ─────────────────────────────────────────────────────────────────────────────
//  CLAUSES ISO ↔ MODULES (source de vérité)
// ─────────────────────────────────────────────────────────────────────────────
//
// Les clauses retenues sont celles activement instrumentalisées par SafeX 360.
// Le mapping reflète la couverture FONCTIONNELLE actuelle, pas une intention.
//
export const ISO_CLAUSES: IsoClause[] = [

    // ─────────── ISO 45001:2018 — SST ───────────
    { code: '4.1',   standard: 'ISO 45001', title: "Compréhension du contexte de l'organisme",          coveredBy: ['dashboard', 'reports'] },
    { code: '5.1',   standard: 'ISO 45001', title: 'Leadership et engagement',                          coveredBy: ['dashboard', 'communication'] },
    { code: '6.1.2', standard: 'ISO 45001', title: "Identification des dangers et évaluation des risques", coveredBy: ['risks', 'preventive-activities'] },
    { code: '6.1.3', standard: 'ISO 45001', title: "Détermination des exigences légales",               coveredBy: ['compliance'] },
    { code: '6.2',   standard: 'ISO 45001', title: 'Objectifs SST et planification',                    coveredBy: ['planning', 'dashboard'] },
    { code: '7.2',   standard: 'ISO 45001', title: 'Compétence du personnel',                           coveredBy: ['knowledge'] },
    { code: '7.3',   standard: 'ISO 45001', title: 'Sensibilisation',                                    coveredBy: ['communication', 'knowledge'] },
    { code: '7.4',   standard: 'ISO 45001', title: 'Communication',                                      coveredBy: ['communication'] },
    { code: '7.5',   standard: 'ISO 45001', title: 'Informations documentées',                          coveredBy: ['knowledge'] },
    { code: '8.1.2', standard: 'ISO 45001', title: 'Élimination des dangers et réduction des risques',  coveredBy: ['risks', 'corrective-actions'] },
    { code: '8.2',   standard: 'ISO 45001', title: "Préparation et réponse aux situations d'urgence",    coveredBy: ['incidents', 'communication'] },
    { code: '9.1.1', standard: 'ISO 45001', title: 'Surveillance, mesurage, analyse et évaluation',     coveredBy: ['monitoring', 'reports'] },
    { code: '9.2',   standard: 'ISO 45001', title: 'Audit interne',                                      coveredBy: ['audits'] },
    { code: '10.2',  standard: 'ISO 45001', title: 'Incident, non-conformité et actions correctives',   coveredBy: ['incidents', 'corrective-actions', 'investigations'] },
    { code: '10.3',  standard: 'ISO 45001', title: "Amélioration continue",                              coveredBy: ['corrective-actions', 'reports'] },

    // EPI — clause spécifique implicite via 8.1.2
    { code: '8.1.2.PPE', standard: 'ISO 45001', title: "EPI — dotation, port et vérification",          coveredBy: ['ppe'] },

    // ─────────── ISO 14001:2015 — Environnement ───────────
    { code: '6.1.2-E', standard: 'ISO 14001', title: 'Aspects environnementaux',                        coveredBy: ['risks', 'monitoring'] },
    { code: '6.1.3-E', standard: 'ISO 14001', title: 'Obligations de conformité',                       coveredBy: ['compliance'] },
    { code: '8.1-E',   standard: 'ISO 14001', title: 'Planification et maîtrise opérationnelle',        coveredBy: ['planning', 'preventive-activities'] },
    { code: '8.2-E',   standard: 'ISO 14001', title: "Préparation et réponse aux situations d'urgence", coveredBy: ['incidents'] },
    { code: '9.1.2-E', standard: 'ISO 14001', title: 'Évaluation de la conformité environnementale',    coveredBy: ['compliance', 'audits'] },

    // ─────────── ISO 9001:2015 — Qualité ───────────
    { code: '7.1.3', standard: 'ISO 9001', title: 'Infrastructure',                                     coveredBy: ['preventive-activities'] },
    { code: '8.5.1', standard: 'ISO 9001', title: 'Maîtrise de la production et de la prestation',     coveredBy: ['audits', 'preventive-activities'] },
    { code: '9.1.3', standard: 'ISO 9001', title: 'Analyse et évaluation',                              coveredBy: ['reports'] },
    { code: '10.2',  standard: 'ISO 9001', title: 'Non-conformité et action corrective',                coveredBy: ['corrective-actions'] },

    // ─────────── ISO 19011:2018 — Audit ───────────
    { code: '5.1-A',   standard: 'ISO 19011', title: "Programme d'audit",                               coveredBy: ['audits', 'planning'] },
    { code: '6.3-A',   standard: 'ISO 19011', title: "Préparation de l'audit",                          coveredBy: ['audits'] },
    { code: '6.4-A',   standard: 'ISO 19011', title: 'Réalisation des activités d\'audit',              coveredBy: ['audits'] },
    { code: '6.5-A',   standard: 'ISO 19011', title: 'Rapport d\'audit',                                 coveredBy: ['audits', 'reports'] },
    { code: '6.7-A',   standard: 'ISO 19011', title: "Suivi de l'audit",                                coveredBy: ['corrective-actions'] },

    // ─────────── ISO 31000:2018 — Risque ───────────
    { code: '6.3-R',   standard: 'ISO 31000', title: "Communication et consultation",                   coveredBy: ['communication'] },
    { code: '6.4.2-R', standard: 'ISO 31000', title: "Identification des risques",                      coveredBy: ['risks'] },
    { code: '6.4.3-R', standard: 'ISO 31000', title: "Analyse des risques",                             coveredBy: ['risks'] },
    { code: '6.4.4-R', standard: 'ISO 31000', title: "Évaluation des risques",                          coveredBy: ['risks'] },
    { code: '6.5-R',   standard: 'ISO 31000', title: "Traitement des risques",                          coveredBy: ['risks', 'corrective-actions'] },
    { code: '6.6-R',   standard: 'ISO 31000', title: "Suivi et revue",                                  coveredBy: ['monitoring', 'reports'] },
];

// ─────────────────────────────────────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/** Toutes les clauses qui sollicitent un module donné. */
export function clausesForModule(moduleId: SafeXModuleId): IsoClause[] {
    return ISO_CLAUSES.filter((c) => c.coveredBy.includes(moduleId));
}

/** Tous les modules qui couvrent une clause donnée. */
export function modulesForClause(clauseCode: string): SafeXModule[] {
    const clause = ISO_CLAUSES.find((c) => c.code === clauseCode);
    if (!clause) return [];
    return SAFEX_MODULES.filter((m) => clause.coveredBy.includes(m.id));
}

/** Indicateur synthétique de couverture (nombre de clauses référencées). */
export function coverageStats() {
    const total = ISO_CLAUSES.length;
    const byStandard: Record<IsoStandardCode, number> = {
        'ISO 45001': 0,
        'ISO 14001': 0,
        'ISO 9001': 0,
        'ISO 19011': 0,
        'ISO 31000': 0,
    };
    ISO_CLAUSES.forEach((c) => {
        byStandard[c.standard] = (byStandard[c.standard] || 0) + 1;
    });
    return { total, byStandard };
}
