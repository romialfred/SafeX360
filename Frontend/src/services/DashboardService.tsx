/**
 * DashboardService — agrégats du tableau de bord Santé & Sécurité au travail
 * (backend HNS, /hns/dashboard).
 *
 * Scoping mine : l'intercepteur Axios injecte automatiquement `?companyId=` sur
 * toutes les requetes — on ne le passe JAMAIS ici (aligne sur IndicatorService).
 *
 * CONTRAT D'HONNÊTETÉ DES DONNÉES — cet écran remplaçait une maquette dont tous
 * les chiffres étaient inventés. Toute métrique sans source dans le modèle de
 * données vaut `null` et JAMAIS 0 : « inconnu » et « zéro » sont deux
 * informations différentes. L'IHM affiche « — » sur un `null`.
 *
 * Contrat backend (fige) :
 *   GET /hns/dashboard/ohs?year={year}  -> DashboardOhsDTO
 */

import axiosInstance from '../interceptors/AxiosInterceptor';

const DASHBOARD = '/hns/dashboard';

/** Couple libellé / décompte (catégorie, gravité, mine, niveau de risque). */
export interface LabelCountDTO {
    label: string;
    count: number;
}

/** Point de la courbe mensuelle. `month` est 1-based (1 = janvier). */
export interface MonthlyPointDTO {
    month: number;
    incidents: number;
    nearMiss: number;
}

/** Alerte HSE calculée sur des décomptes réels strictement positifs. */
export interface DashboardAlertDTO {
    priority: 'high' | 'medium' | 'low' | string;
    title: string;
    value: string;
    description: string;
}

/**
 * Métrique DÉCLARÉE (saisie dans le module Indicateurs), jamais calculée.
 * `source = "DECLARED"` : l'IHM DOIT l'annoncer comme telle, sous peine de
 * faire passer une saisie manuelle pour une mesure automatique.
 */
export interface DeclaredMetricDTO {
    value: number;
    /** NULLABLE — cible du plan pour la période retenue. */
    target: number | null;
    source: string;
    /** Libellé de la période effectivement renseignée (ex. « Mars »). */
    period: string;
}

export interface DashboardKpisDTO {
    totalIncidentsYtd: number;
    totalIncidentsPreviousYtd: number;
    nearMissCount: number;
    /** NULLABLE — null = aucun incident grave enregistré (≠ 0 jour). */
    daysWithoutSeriousIncident: number | null;
    /** NULLABLE — null = aucune valeur déclarée. */
    ltifr: DeclaredMetricDTO | null;
}

/**
 * Synthèse d'un plan de charge (actions correctives, inspections).
 *
 * Forme PARTAGÉE par les deux domaines : ils répondent à la même question de
 * pilotage (« combien en cours, combien de retard ? »), donc un seul type et un
 * seul composant d'IHM.
 *
 * Aucun taux n'est pré-calculé côté serveur : `total` peut valoir 0 et un
 * pourcentage sur un dénominateur nul serait une invention. C'est l'IHM qui
 * décide d'afficher — ou non — un avancement.
 */
export interface WorkloadSummaryDTO {
    total: number;
    /** Éléments dans un statut NON terminal. */
    open: number;
    /** Éléments dans un statut terminal (clos, annulé, archivé…). */
    closed: number;
    /** Échéance dépassée et statut non terminal. Les éléments sans échéance en sont exclus. */
    overdue: number;
    /** Détail par statut — série EXCLUSIVE (sa somme est `total`). */
    byStatus: LabelCountDTO[];
}

export interface DashboardOhsDTO {
    year: number;
    /** null = vue consolidée toutes mines. */
    companyId: number | null;
    kpis: DashboardKpisDTO;
    incidentsByCategory: LabelCountDTO[];
    incidentsBySeverity: LabelCountDTO[];
    /** Toujours 12 points (mois vides complétés à 0 par le serveur). */
    monthlyTrend: MonthlyPointDTO[];
    alerts: DashboardAlertDTO[];
    /** NULLABLE — renseigné uniquement en vue consolidée. */
    incidentsByMine: LabelCountDTO[] | null;
    /** NULLABLE — labels = clés brutes « PS » de la matrice (ex. « 35 »). */
    riskByLevel: LabelCountDTO[] | null;

    /**
     * Répartition des incidents par STATUT de traitement (ISO 45001 §10.2).
     * Série EXCLUSIVE : sa somme égale `kpis.totalIncidentsYtd`.
     */
    incidentsByStatus: LabelCountDTO[];

    /** Actions correctives créées durant l'exercice (ISO 45001 §10.2). */
    actions: WorkloadSummaryDTO;

    /** Inspections dont la date PRÉVUE tombe dans l'exercice (ISO 45001 §9.1). */
    inspections: WorkloadSummaryDTO;
}

/**
 * Agrégat OHS de l'année demandée. Ne rattrape PAS l'erreur : l'appelant gère
 * et affiche un bandeau — un tableau de bord silencieusement vide mentirait
 * autant qu'une maquette.
 */
export const getOhsDashboard = (year: number): Promise<DashboardOhsDTO> =>
    axiosInstance
        .get<DashboardOhsDTO>(`${DASHBOARD}/ohs`, { params: { year } })
        .then((r) => r.data);
