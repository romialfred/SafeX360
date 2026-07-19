/**
 * Registre contrôlé des référentiels ISO et cartographie des capacités SafeX.
 *
 * Ce fichier ne reproduit pas le contenu normatif. Les libellés sont des
 * repères de travail paraphrasés. Seule la publication officielle ISO fait foi.
 * Une route ou une fonctionnalité indique un support produit ; elle ne prouve
 * ni l'application, ni l'efficacité, ni la conformité d'une organisation.
 */

export type IsoStandardCode =
    | 'ISO 45001'
    | 'ISO 14001'
    | 'ISO 9001'
    | 'ISO 19011'
    | 'ISO 31000';

export type EvidenceMaturity =
    | 'NOT_SUPPORTED'
    | 'SUPPORTED'
    | 'CONFIGURED'
    | 'APPLIED'
    | 'VERIFIED'
    | 'EFFECTIVE';

export type ProductSupport = 'SUPPORTED' | 'PARTIAL' | 'OUTSIDE_PRODUCT';

export const ISO_REGISTRY_VERSION = '2026.07.19-1';

export interface IsoStandard {
    code: IsoStandardCode;
    fullName: string;
    year: number;
    edition: number;
    publicationDate: string;
    lifecycleStatus: 'PUBLISHED' | 'UNDER_PUBLICATION';
    amendment?: string;
    officialSource: string;
    ownerRole: string;
    reviewedAt: string;
    nextReviewDate: string;
    approvalStatus: 'PENDING_HUMAN_APPROVAL' | 'APPROVED';
    impactStatement: string;
    color: string;
}

export const ISO_STANDARDS: IsoStandard[] = [
    {
        code: 'ISO 45001',
        fullName: 'Management de la santé et de la sécurité au travail',
        year: 2018,
        edition: 1,
        publicationDate: '2018-03',
        lifecycleStatus: 'PUBLISHED',
        amendment: 'Amd 1:2024 — action climatique',
        officialSource: 'https://www.iso.org/standard/63787.html',
        ownerRole: 'Responsable SMSST',
        reviewedAt: '2026-07-19',
        nextReviewDate: '2026-10-19',
        approvalStatus: 'PENDING_HUMAN_APPROVAL',
        impactStatement: 'Édition publiée confirmée en 2024 ; surveiller la révision annoncée par ISO.',
        color: 'red-700',
    },
    {
        code: 'ISO 14001',
        fullName: 'Management environnemental',
        year: 2026,
        edition: 4,
        publicationDate: '2026-04',
        lifecycleStatus: 'PUBLISHED',
        officialSource: 'https://www.iso.org/standard/14001',
        ownerRole: 'Responsable environnement',
        reviewedAt: '2026-07-19',
        nextReviewDate: '2026-10-19',
        approvalStatus: 'PENDING_HUMAN_APPROVAL',
        impactStatement: 'L’édition 2015 est retirée ; une analyse de transition organisationnelle reste requise.',
        color: 'emerald-700',
    },
    {
        code: 'ISO 9001',
        fullName: 'Management de la qualité',
        year: 2015,
        edition: 5,
        publicationDate: '2015-09',
        lifecycleStatus: 'PUBLISHED',
        amendment: 'Amd 1:2024 — action climatique',
        officialSource: 'https://www.iso.org/standard/62085.html',
        ownerRole: 'Responsable qualité',
        reviewedAt: '2026-07-19',
        nextReviewDate: '2026-09-30',
        approvalStatus: 'PENDING_HUMAN_APPROVAL',
        impactStatement: 'Édition encore publiée ; la prochaine édition est annoncée mais n’est pas la référence en vigueur.',
        color: 'blue-700',
    },
    {
        code: 'ISO 19011',
        fullName: 'Lignes directrices pour l’audit des systèmes de management',
        year: 2026,
        edition: 4,
        publicationDate: '2026-05',
        lifecycleStatus: 'PUBLISHED',
        officialSource: 'https://www.iso.org/standard/19011',
        ownerRole: 'Responsable du programme d’audit',
        reviewedAt: '2026-07-19',
        nextReviewDate: '2026-10-19',
        approvalStatus: 'PENDING_HUMAN_APPROVAL',
        impactStatement: 'Édition 2018 retirée : programme, risques, conduite, suivi et compétences doivent être revus humainement.',
        color: 'indigo-700',
    },
    {
        code: 'ISO 31000',
        fullName: 'Management du risque — lignes directrices',
        year: 2018,
        edition: 2,
        publicationDate: '2018-02',
        lifecycleStatus: 'PUBLISHED',
        officialSource: 'https://www.iso.org/standard/65694.html',
        ownerRole: 'Responsable risques',
        reviewedAt: '2026-07-19',
        nextReviewDate: '2026-10-19',
        approvalStatus: 'PENDING_HUMAN_APPROVAL',
        impactStatement: 'Édition publiée confirmée en 2023 ; surveiller sa révision.',
        color: 'amber-700',
    },
];

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
    routes: string[];
    description: string;
}

export const SAFEX_MODULES: SafeXModule[] = [
    { id: 'dashboard', label: 'Tableau de bord HSE', routes: ['/dashboard'], description: 'Vue agrégée des indicateurs disponibles' },
    { id: 'incidents', label: 'Incidents et accidents', routes: ['/incidents'], description: 'Déclaration, enquête et suivi des événements' },
    { id: 'audits', label: 'Audits internes', routes: ['/audit-management'], description: 'Programme, préparation, exécution et suivi' },
    { id: 'corrective-actions', label: 'Actions correctives', routes: ['/corrective'], description: 'Traitement et vérification des actions' },
    { id: 'risks', label: 'Registre des risques', routes: ['/risks-register'], description: 'Identification, évaluation et traitement' },
    { id: 'ppe', label: 'Gestion des EPI', routes: ['/ppe-management'], description: 'Dotation et suivi des équipements individuels' },
    { id: 'compliance', label: 'Exigences réglementaires', routes: ['/compliance-requirements'], description: 'Registre des obligations et preuves associées' },
    { id: 'communication', label: 'Communications HSE', routes: ['/communications'], description: 'Communications et réception des informations' },
    { id: 'planning', label: 'Planification HSE', routes: ['/hs-activities-planning'], description: 'Planification des activités et échéances' },
    { id: 'reports', label: 'Rapports de pilotage', routes: ['/executive-reports'], description: 'Restitution des données disponibles' },
    { id: 'knowledge', label: 'Documents et références', routes: ['/document-management', '/iso-documents'], description: 'Documents internes et métadonnées normatives' },
    { id: 'preventive-activities', label: 'Inspections', routes: ['/inspections'], description: 'Planification et exécution des contrôles terrain' },
    { id: 'investigations', label: 'Investigations', routes: ['/investigation'], description: 'Analyse documentée des événements' },
    { id: 'monitoring', label: 'Revue des KPI', routes: ['/KPI-reports'], description: 'Mesure et revue des indicateurs enregistrés' },
];

export interface IsoClause {
    /** Identifiant composite stable ; les numéros de clause se répètent entre normes. */
    id: string;
    code: string;
    standard: IsoStandardCode;
    title: string;
    process: string;
    ownerRole: string;
    expectedEvidence: string;
    controlMethod: string;
    result: string;
    productSupport: ProductSupport;
    maturity: EvidenceMaturity;
    gap: string;
    coveredBy: SafeXModuleId[];
}

type ClauseSeed = Omit<IsoClause, 'id' | 'maturity' | 'result'> & {
    maturity?: EvidenceMaturity;
    result?: string;
};

const clause = (seed: ClauseSeed): IsoClause => ({
    ...seed,
    id: `${seed.standard}:${seed.code}`,
    maturity: seed.maturity ?? (seed.productSupport === 'OUTSIDE_PRODUCT' ? 'NOT_SUPPORTED' : 'SUPPORTED'),
    result: seed.result ?? 'Non évalué — preuve organisationnelle requise',
});

const ohs = (
    code: string,
    title: string,
    process: string,
    ownerRole: string,
    coveredBy: SafeXModuleId[],
    productSupport: ProductSupport,
    expectedEvidence: string,
    controlMethod: string,
    gap: string,
) => clause({
    code,
    standard: 'ISO 45001',
    title,
    process,
    ownerRole,
    coveredBy,
    productSupport,
    expectedEvidence,
    controlMethod,
    gap,
});

/**
 * Matrice de traçabilité produit. Les titres sont des repères paraphrasés et
 * non une copie de la norme. Tous les résultats restent non évalués tant que
 * les preuves réelles de l'organisation n'ont pas été examinées et approuvées.
 */
export const ISO_CLAUSES: IsoClause[] = [
    ohs('4.1', 'Contexte interne et externe', 'Analyse du contexte', 'Direction SMSST', ['reports'], 'PARTIAL', 'Analyse datée, sources et décisions', 'Revue annuelle et après changement majeur', 'Aucun workflow d’analyse et d’approbation dédié'),
    ohs('4.2', 'Travailleurs et autres parties intéressées', 'Registre des parties intéressées', 'Responsable SMSST', ['communication'], 'PARTIAL', 'Registre, besoins, obligations et date de revue', 'Validation croisée avec le registre légal', 'Registre structuré et preuve de consultation absents'),
    ohs('4.3', 'Périmètre du SMSST', 'Maîtrise du périmètre', 'Direction SMSST', ['knowledge'], 'PARTIAL', 'Périmètre approuvé, exclusions justifiées et version', 'Approbation de direction', 'Document approuvé non imposé par le produit'),
    ohs('4.4', 'Processus du SMSST', 'Cartographie des processus', 'Responsable SMSST', ['reports'], 'PARTIAL', 'Processus, interactions, pilotes et mesures', 'Revue du système', 'Interactions et critères d’efficacité non structurés'),
    ohs('5.1', 'Leadership et engagement', 'Pilotage de direction', 'Direction générale', ['reports'], 'PARTIAL', 'Décisions, ressources et arbitrages signés', 'Revue de direction', 'Un tableau de bord ne constitue pas une preuve de leadership'),
    ohs('5.2', 'Politique SST', 'Maîtrise de la politique', 'Direction générale', ['knowledge', 'communication'], 'PARTIAL', 'Politique approuvée, versionnée, diffusée et revue', 'Approbation et accusés de réception', 'Cycle complet de politique non imposé'),
    ohs('5.3', 'Rôles, responsabilités et autorités', 'Gouvernance SMSST', 'Direction générale', ['knowledge'], 'PARTIAL', 'Matrice RACI approuvée et nominations', 'Revue des délégations', 'RACI organisationnelle signée absente'),
    ohs('5.4', 'Consultation et participation des travailleurs', 'Participation des travailleurs', 'Responsable SMSST', ['communication'], 'PARTIAL', 'Avis, participants, barrières, décisions et suites', 'Contrôle des réponses et délais', 'Registre de consultation dédié absent'),
    ohs('6.1.1', 'Risques et opportunités du système', 'Planification SMSST', 'Responsable risques', ['risks'], 'PARTIAL', 'Méthode, critères, registre et plans', 'Revue des risques du système', 'Risques opérationnels présents, risques du SMSST à distinguer'),
    ohs('6.1.2', 'Dangers et risques SST', 'Évaluation des risques', 'Responsable risques', ['risks', 'preventive-activities'], 'SUPPORTED', 'Danger, exposition, cotation, mesures et révision', 'Approbation de l’évaluation', 'L’efficacité des mesures exige une vérification terrain'),
    ohs('6.1.3', 'Obligations légales et autres exigences', 'Veille réglementaire', 'Responsable conformité', ['compliance'], 'PARTIAL', 'Source officielle, juridiction, applicabilité et version', 'Revue juridique locale', 'Moteur juridictionnel et validation juridique restent requis'),
    ohs('6.1.4', 'Planification des actions', 'Plans de traitement', 'Responsable SMSST', ['corrective-actions', 'planning'], 'PARTIAL', 'Action, pilote, moyens, échéance et efficacité', 'Revue de clôture indépendante', 'Lien systématique obligation-risque-action à compléter'),
    ohs('6.2', 'Objectifs SST et plans associés', 'Pilotage des objectifs', 'Direction SMSST', ['planning', 'monitoring'], 'PARTIAL', 'Objectif, base, cible, moyens, pilote et échéance', 'Revue périodique des résultats', 'Objectifs et KPI ne sont pas reliés de bout en bout'),
    ohs('7.1', 'Ressources', 'Planification des ressources', 'Direction SMSST', ['planning'], 'PARTIAL', 'Besoins, décision budgétaire et adéquation', 'Revue d’adéquation', 'Processus de détermination des ressources absent'),
    ohs('7.2', 'Compétences', 'Gestion des compétences', 'Responsable formation', ['knowledge'], 'PARTIAL', 'Matrice poste-risque-compétence, évaluation et échéance', 'Évaluation d’efficacité et renouvellement', 'Matrice et évaluation d’efficacité non systématiques'),
    ohs('7.3', 'Sensibilisation', 'Sensibilisation HSE', 'Responsable formation', ['communication', 'knowledge'], 'PARTIAL', 'Contenu, population, réception et compréhension', 'Contrôle de compréhension', 'La diffusion seule ne prouve pas la compréhension'),
    ohs('7.4', 'Communication', 'Communication interne et externe', 'Responsable communication HSE', ['communication'], 'SUPPORTED', 'Objet, émetteur, destinataires, date et réception', 'Revue de réception et d’efficacité', 'Critères d’efficacité à définir par l’organisation'),
    ohs('7.5', 'Informations documentées', 'Maîtrise documentaire', 'Responsable documentaire', ['knowledge'], 'PARTIAL', 'Propriétaire, version, approbation, accès et rétention', 'Revue documentaire périodique', 'Rétention et droits doivent être configurés et audités'),
    ohs('8.1.1', 'Planification et maîtrise opérationnelles', 'Maîtrise opérationnelle', 'Responsable opérations', ['preventive-activities', 'planning'], 'PARTIAL', 'Critères, instructions, enregistrements et résultats', 'Inspection et revue des écarts', 'Critères organisationnels à approuver'),
    ohs('8.1.2', 'Hiérarchie des mesures de prévention', 'Traitement des risques', 'Responsable risques', ['risks', 'ppe'], 'PARTIAL', 'Choix justifié depuis élimination jusqu’aux EPI', 'Revue hiérarchique des mesures', 'L’EPI ne doit pas être assimilé à la clause elle-même'),
    ohs('8.1.3', 'Management du changement', 'Maîtrise des changements', 'Responsable opérations', [], 'OUTSIDE_PRODUCT', 'Demande, impacts, consultations, approbations et suivi', 'Gate avant changement et revue post-changement', 'Workflow MOC dédié absent'),
    ohs('8.1.4', 'Achats, sous-traitants et externalisation', 'Maîtrise des fournisseurs', 'Responsable achats', ['compliance'], 'PARTIAL', 'Qualification, exigences HSE, évaluation et décision', 'Revue fournisseur et contrôle contractuel', 'Qualification et exigences contractuelles non reliées'),
    ohs('8.2', 'Préparation et réponse aux urgences', 'Gestion des urgences', 'Responsable urgences', ['incidents', 'communication'], 'SUPPORTED', 'Plans, exercices, alertes, comptes rendus et actions', 'Exercices et retour d’expérience', 'Disponibilité réelle et exercices restent à démontrer'),
    ohs('9.1.1', 'Surveillance, mesure et évaluation', 'Mesure de la performance', 'Responsable performance HSE', ['monitoring', 'reports'], 'PARTIAL', 'Définition KPI, source, périmètre, qualité et résultat', 'Revue de cohérence et traçabilité du calcul', 'Qualité et origine des indicateurs à attester'),
    ohs('9.1.2', 'Évaluation de conformité', 'Évaluation réglementaire', 'Responsable conformité', ['compliance', 'audits'], 'PARTIAL', 'Évaluateur, périodicité, résultat et preuve', 'Revue juridique et plan d’action', 'Juridiction et preuves de résultat restent requises'),
    ohs('9.2', 'Audit interne', 'Programme d’audit', 'Responsable du programme d’audit', ['audits'], 'SUPPORTED', 'Programme, indépendance, compétences, constats et suivi', 'Revue du programme et efficacité', 'Transition ISO 19011:2026 à valider par un auditeur compétent'),
    ohs('9.3', 'Revue de direction', 'Revue de direction', 'Direction générale', ['reports'], 'PARTIAL', 'Entrées, participants, décisions, actions et procès-verbal signé', 'Suivi des décisions', 'Un rapport exécutif ne constitue pas une revue de direction'),
    ohs('10.1', 'Opportunités d’amélioration', 'Amélioration', 'Responsable SMSST', ['corrective-actions', 'reports'], 'PARTIAL', 'Opportunité, décision, action et bénéfice attendu', 'Revue des résultats', 'Registre et critères de sélection à structurer'),
    ohs('10.2', 'Incidents, non-conformités et actions', 'Traitement des événements', 'Responsable SMSST', ['incidents', 'corrective-actions', 'investigations'], 'SUPPORTED', 'Événement, causes, actions, approbation et efficacité', 'Vérification indépendante de clôture', 'Indépendance et preuve d’efficacité à généraliser'),
    ohs('10.3', 'Amélioration continue', 'Amélioration du SMSST', 'Direction SMSST', ['reports', 'corrective-actions'], 'PARTIAL', 'Tendance, décision, changement et résultat mesuré', 'Revue de direction', 'Résultats organisationnels réels requis'),

    clause({ code: '6.1.2', standard: 'ISO 14001', title: 'Aspects environnementaux', process: 'Analyse environnementale', ownerRole: 'Responsable environnement', expectedEvidence: 'Registre des aspects et impacts', controlMethod: 'Revue environnementale', productSupport: 'PARTIAL', gap: 'Transition 2026 et preuves organisationnelles à valider', coveredBy: ['risks', 'monitoring'] }),
    clause({ code: '8.1', standard: 'ISO 14001', title: 'Maîtrise opérationnelle environnementale', process: 'Maîtrise environnementale', ownerRole: 'Responsable environnement', expectedEvidence: 'Critères et enregistrements opérationnels', controlMethod: 'Contrôles terrain', productSupport: 'PARTIAL', gap: 'Analyse d’impact de l’édition 2026 requise', coveredBy: ['planning', 'preventive-activities'] }),
    clause({ code: '9.1.2', standard: 'ISO 14001', title: 'Évaluation des obligations environnementales', process: 'Évaluation de conformité', ownerRole: 'Responsable conformité', expectedEvidence: 'Résultats par juridiction', controlMethod: 'Revue juridique', productSupport: 'PARTIAL', gap: 'Validation locale requise', coveredBy: ['compliance', 'audits'] }),

    clause({ code: '4.1', standard: 'ISO 9001', title: 'Contexte du système qualité', process: 'Analyse du contexte QMS', ownerRole: 'Responsable qualité', expectedEvidence: 'Analyse approuvée et datée', controlMethod: 'Revue QMS', productSupport: 'PARTIAL', gap: 'QMS de développement/exploitation à auditer', coveredBy: ['reports'] }),
    clause({ code: '7.5', standard: 'ISO 9001', title: 'Informations documentées qualité', process: 'Maîtrise documentaire', ownerRole: 'Responsable qualité', expectedEvidence: 'Versions, approbations et rétention', controlMethod: 'Audit documentaire', productSupport: 'PARTIAL', gap: 'Rétention et diffusion à configurer', coveredBy: ['knowledge'] }),
    clause({ code: '8.4', standard: 'ISO 9001', title: 'Prestataires externes', process: 'Maîtrise fournisseurs', ownerRole: 'Responsable achats', expectedEvidence: 'Qualification et surveillance', controlMethod: 'Évaluation fournisseur', productSupport: 'PARTIAL', gap: 'Processus contractuel externe requis', coveredBy: ['compliance'] }),
    clause({ code: '9.2', standard: 'ISO 9001', title: 'Audit interne qualité', process: 'Audit interne', ownerRole: 'Responsable qualité', expectedEvidence: 'Programme, rapports et suivis', controlMethod: 'Revue du programme', productSupport: 'SUPPORTED', gap: 'Application et efficacité à démontrer', coveredBy: ['audits'] }),
    clause({ code: '9.3', standard: 'ISO 9001', title: 'Revue de direction qualité', process: 'Revue de direction', ownerRole: 'Direction générale', expectedEvidence: 'Entrées, décisions et procès-verbal', controlMethod: 'Suivi des décisions', productSupport: 'PARTIAL', gap: 'Workflow de revue absent', coveredBy: ['reports'] }),
    clause({ code: '10.2', standard: 'ISO 9001', title: 'Non-conformité et action corrective', process: 'CAPA', ownerRole: 'Responsable qualité', expectedEvidence: 'Cause, action et efficacité', controlMethod: 'Revue indépendante', productSupport: 'SUPPORTED', gap: 'Efficacité organisationnelle à démontrer', coveredBy: ['corrective-actions'] }),

    clause({ code: '4', standard: 'ISO 19011', title: 'Principes de l’audit', process: 'Cadre méthodologique', ownerRole: 'Responsable du programme d’audit', expectedEvidence: 'Charte et règles approuvées', controlMethod: 'Revue méthodologique', productSupport: 'PARTIAL', gap: 'Analyse d’impact 2026 par auditeur compétent requise', coveredBy: ['audits'] }),
    clause({ code: '5.2', standard: 'ISO 19011', title: 'Objectifs du programme d’audit', process: 'Programme d’audit', ownerRole: 'Responsable du programme d’audit', expectedEvidence: 'Objectifs et justification', controlMethod: 'Approbation du programme', productSupport: 'SUPPORTED', gap: 'Objectifs réels à approuver', coveredBy: ['audits', 'planning'] }),
    clause({ code: '5.3', standard: 'ISO 19011', title: 'Risques et opportunités du programme', process: 'Risques du programme d’audit', ownerRole: 'Responsable du programme d’audit', expectedEvidence: 'Analyse et traitements', controlMethod: 'Revue du programme', productSupport: 'PARTIAL', gap: 'Revue 2026 humaine requise', coveredBy: ['audits', 'risks'] }),
    clause({ code: '5.4-5.7', standard: 'ISO 19011', title: 'Établissement, mise en œuvre et revue du programme', process: 'Cycle du programme d’audit', ownerRole: 'Responsable du programme d’audit', expectedEvidence: 'Programme, ressources, suivi et amélioration', controlMethod: 'Revue périodique', productSupport: 'SUPPORTED', gap: 'Efficacité réelle à démontrer', coveredBy: ['audits', 'planning'] }),
    clause({ code: '6.2-6.7', standard: 'ISO 19011', title: 'Conduite et suivi d’un audit', process: 'Réalisation des audits', ownerRole: 'Responsable d’audit', expectedEvidence: 'Dossier d’audit complet et suivi', controlMethod: 'Revue qualité du dossier', productSupport: 'SUPPORTED', gap: 'Conformité méthodologique 2026 à valider', coveredBy: ['audits', 'corrective-actions'] }),
    clause({ code: '7', standard: 'ISO 19011', title: 'Compétence et évaluation des auditeurs', process: 'Qualification des auditeurs', ownerRole: 'Responsable du programme d’audit', expectedEvidence: 'Critères, évaluations et décisions', controlMethod: 'Revue annuelle des compétences', productSupport: 'PARTIAL', gap: 'Critères 2026 et évaluations humaines à approuver', coveredBy: ['audits', 'knowledge'] }),

    clause({ code: '6.3', standard: 'ISO 31000', title: 'Communication et consultation du risque', process: 'Concertation risques', ownerRole: 'Responsable risques', expectedEvidence: 'Participants, avis et décisions', controlMethod: 'Revue des consultations', productSupport: 'PARTIAL', gap: 'Participation réelle à démontrer', coveredBy: ['communication', 'risks'] }),
    clause({ code: '6.4', standard: 'ISO 31000', title: 'Appréciation du risque', process: 'Évaluation des risques', ownerRole: 'Responsable risques', expectedEvidence: 'Identification, analyse et évaluation', controlMethod: 'Revue des cotations', productSupport: 'SUPPORTED', gap: 'Méthode organisationnelle à approuver', coveredBy: ['risks'] }),
    clause({ code: '6.5', standard: 'ISO 31000', title: 'Traitement du risque', process: 'Plans de traitement', ownerRole: 'Responsable risques', expectedEvidence: 'Options, décisions et actions', controlMethod: 'Vérification des traitements', productSupport: 'SUPPORTED', gap: 'Efficacité réelle à démontrer', coveredBy: ['risks', 'corrective-actions'] }),
];

export interface OrganizationalProcessControl {
    id: string;
    process: string;
    clauses: string[];
    support: ProductSupport;
    ownerRole: string;
    inputs: string;
    decisions: string;
    participants: string;
    signedEvidence: string;
    dueRule: string;
    versioning: string;
    retention: string;
    effectivenessIndicator: string;
    availableRoutes: string[];
    residual: string;
}

/** Périmètre produit/hors produit pour les processus organisationnels structurants. */
export const ORGANIZATIONAL_PROCESS_CONTROLS: OrganizationalProcessControl[] = [
    { id: 'context', process: 'Contexte, parties intéressées et périmètre', clauses: ['ISO 45001 4.1–4.4', 'ISO 9001 4.1–4.4'], support: 'PARTIAL', ownerRole: 'Direction SMSST / Qualité', inputs: 'Enjeux, parties, obligations, activités et sites', decisions: 'Périmètre, priorités et processus', participants: 'Direction, travailleurs, HSE, qualité, juridique', signedEvidence: 'Analyse et périmètre approuvés', dueRule: 'Annuelle et après changement significatif', versioning: 'Version majeure à chaque approbation', retention: 'Durée à définir par l’organisation', effectivenessIndicator: 'Décisions prises dans les délais', availableRoutes: ['/document-management', '/compliance-requirements'], residual: 'Modèle de dossier possible ; workflow d’approbation dédié absent' },
    { id: 'policy', process: 'Politique SST et qualité', clauses: ['ISO 45001 5.2', 'ISO 9001 5.2'], support: 'PARTIAL', ownerRole: 'Direction générale', inputs: 'Contexte, engagements et obligations', decisions: 'Approbation, diffusion et révision', participants: 'Direction, HSE, qualité, représentants des travailleurs', signedEvidence: 'Politique signée et accusés de réception', dueRule: 'À chaque révision et revue planifiée', versioning: 'Version approuvée non écrasable', retention: 'Selon politique documentaire approuvée', effectivenessIndicator: 'Taux de réception et compréhension', availableRoutes: ['/document-management', '/communications'], residual: 'Signature et preuve de compréhension à organiser' },
    { id: 'roles', process: 'Rôles, responsabilités et autorités', clauses: ['ISO 45001 5.3'], support: 'PARTIAL', ownerRole: 'Direction générale', inputs: 'Organigramme, processus et obligations', decisions: 'Nominations, délégations et suppléances', participants: 'Direction, RH, HSE et qualité', signedEvidence: 'RACI et lettres de nomination', dueRule: 'Après changement organisationnel', versioning: 'Historique des nominations', retention: 'Selon droit social local', effectivenessIndicator: 'Responsabilités sans vacance', availableRoutes: ['/users-admin', '/document-management'], residual: 'RACI approuvée hors plateforme' },
    { id: 'participation', process: 'Consultation et participation des travailleurs', clauses: ['ISO 45001 5.4'], support: 'PARTIAL', ownerRole: 'Responsable SMSST', inputs: 'Avis, risques, changements et incidents', decisions: 'Réponse, action, refus motivé', participants: 'Travailleurs, représentants, encadrement, HSE', signedEvidence: 'Registre des avis et suites', dueRule: 'Délai défini pour chaque consultation', versioning: 'Journal append-only attendu', retention: 'Selon règles sociales et HSE locales', effectivenessIndicator: 'Avis traités et barrières levées', availableRoutes: ['/communications', '/hs-Meetings'], residual: 'Registre dédié et preuve d’absence de représailles requis' },
    { id: 'competence', process: 'Compétences', clauses: ['ISO 45001 7.2', 'ISO 9001 7.2', 'ISO 19011 7'], support: 'PARTIAL', ownerRole: 'Responsable formation', inputs: 'Postes, risques, exigences et évaluations', decisions: 'Qualification, restriction et renouvellement', participants: 'RH, managers, HSE, qualité, auditeurs', signedEvidence: 'Matrice et évaluation d’efficacité', dueRule: 'Avant affectation et avant expiration', versioning: 'Historique par personne et compétence', retention: 'Selon règles RH et réglementaires', effectivenessIndicator: 'Compétences valides et évaluées', availableRoutes: ['/how-to', '/auditor'], residual: 'Matrice poste-risque-compétence de bout en bout absente' },
    { id: 'moc', process: 'Management du changement', clauses: ['ISO 45001 8.1.3'], support: 'OUTSIDE_PRODUCT', ownerRole: 'Responsable opérations', inputs: 'Changement proposé et impacts', decisions: 'Autoriser, différer, refuser, mesures préalables', participants: 'Opérations, travailleurs, HSE, maintenance, achats', signedEvidence: 'Dossier MOC approuvé et revue post-changement', dueRule: 'Avant mise en œuvre', versioning: 'Décisions et révisions immuables', retention: 'Selon criticité et exigences locales', effectivenessIndicator: 'Changements sans impact non maîtrisé', availableRoutes: [], residual: 'Workflow MOC dédié à développer ou maîtriser dans un système externe' },
    { id: 'suppliers', process: 'Achats, sous-traitants et externalisation', clauses: ['ISO 45001 8.1.4', 'ISO 9001 8.4'], support: 'PARTIAL', ownerRole: 'Responsable achats', inputs: 'Risques, cahier des charges et qualifications', decisions: 'Qualifier, imposer des mesures, suspendre', participants: 'Achats, HSE, juridique, opérations, fournisseur', signedEvidence: 'Qualification, clauses HSE et évaluation', dueRule: 'Avant commande et périodiquement', versioning: 'Historique fournisseur', retention: 'Selon contrat et droit local', effectivenessIndicator: 'Fournisseurs évalués sans écart critique ouvert', availableRoutes: ['/compliance-documents', '/document-management'], residual: 'Connexion au cycle achats/contrats externe requise' },
    { id: 'permits', process: 'Permis de travail', clauses: ['ISO 45001 8.1.1'], support: 'OUTSIDE_PRODUCT', ownerRole: 'Responsable opérations', inputs: 'Tâche, énergie, zone, coactivité et compétences', decisions: 'Autoriser, suspendre ou clôturer', participants: 'Émetteur, exécutants, HSE, consignation', signedEvidence: 'Permis signé avec contrôles et clôture', dueRule: 'Avant chaque travail soumis à permis', versioning: 'Aucune modification après émission sans nouvelle version', retention: 'Selon criticité et droit local', effectivenessIndicator: 'Travaux soumis à permis couverts et contrôlés', availableRoutes: [], residual: 'Workflow de permis absent ; ne pas déclarer ce contrôle couvert' },
    { id: 'management-review', process: 'Revue de direction', clauses: ['ISO 45001 9.3', 'ISO 9001 9.3'], support: 'PARTIAL', ownerRole: 'Direction générale', inputs: 'Résultats, audits, objectifs, ressources, changements et parties', decisions: 'Actions, ressources, orientations et changements du système', participants: 'Direction et pilotes de processus', signedEvidence: 'Ordre du jour, présence, procès-verbal et décisions signés', dueRule: 'Périodicité décidée par l’organisation', versioning: 'Procès-verbal figé, corrections tracées', retention: 'Selon politique documentaire approuvée', effectivenessIndicator: 'Décisions clôturées avec résultat vérifié', availableRoutes: ['/executive-reports', '/document-management'], residual: 'Le rapport alimente la revue mais ne constitue pas sa preuve' },
];

/** Toutes les clauses qui sollicitent un module donné. */
export function clausesForModule(moduleId: SafeXModuleId): IsoClause[] {
    return ISO_CLAUSES.filter((item) => item.coveredBy.includes(moduleId));
}

/** Tous les modules associés à une exigence composite ou à un code non ambigu. */
export function modulesForClause(clauseIdOrCode: string): SafeXModule[] {
    const exact = ISO_CLAUSES.find((item) => item.id === clauseIdOrCode);
    const matches = exact ? [exact] : ISO_CLAUSES.filter((item) => item.code === clauseIdOrCode);
    const ids = new Set(matches.flatMap((item) => item.coveredBy));
    return SAFEX_MODULES.filter((module) => ids.has(module.id));
}

/** Comptage des lignes de traçabilité, jamais présenté comme un taux de conformité. */
export function coverageStats() {
    const total = ISO_CLAUSES.length;
    const byStandard: Record<IsoStandardCode, number> = {
        'ISO 45001': 0,
        'ISO 14001': 0,
        'ISO 9001': 0,
        'ISO 19011': 0,
        'ISO 31000': 0,
    };
    ISO_CLAUSES.forEach((item) => {
        byStandard[item.standard] += 1;
    });
    return { total, byStandard };
}
