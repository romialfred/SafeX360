package com.minexpert.hns.dto.dashboard;

import java.util.List;

import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Agrégat du tableau de bord Santé & Sécurité au travail (OHS).
 *
 * <p>CONTRAT D'HONNÊTETÉ DES DONNÉES — cet écran remplace une maquette dont
 * tous les chiffres étaient inventés. Toute métrique dont la source n'existe
 * pas dans le modèle de données vaut {@code null} et JAMAIS 0 : « inconnu » et
 * « zéro » sont deux informations différentes, et les confondre est précisément
 * ce qui rendait la maquette trompeuse. L'IHM affiche « — » sur un
 * {@code null}.</p>
 *
 * <p>Champs volontairement nullables :</p>
 * <ul>
 * <li>{@code kpis.daysWithoutSeriousIncident} — null si aucun incident grave
 * n'est enregistré (on ne sait pas depuis quand, ce n'est pas « 0 jour »).</li>
 * <li>{@code kpis.ltifr} — null si aucune valeur n'a été déclarée ; jamais
 * calculé (voir {@link DeclaredMetricDTO}).</li>
 * <li>{@code incidentsByMine} — null en vue mono-mine (companyId non null) :
 * une répartition par mine n'a aucun sens sur une seule mine.</li>
 * <li>{@code riskByLevel} — null si la répartition des risques n'est pas
 * exploitable (voir le service).</li>
 * </ul>
 */
@Data
@NoArgsConstructor
public class DashboardOhsDTO {

    /** Année de référence effectivement utilisée (défaut = année courante). */
    private Integer year;

    /** Mine sur laquelle l'agrégat a été calculé ; null = vue consolidée. */
    private Long companyId;

    private Kpis kpis;

    /** Répartition des incidents par catégorie (via incident_detail). */
    private List<LabelCountDTO> incidentsByCategory;

    /** Répartition des incidents par gravité maximale. */
    private List<LabelCountDTO> incidentsBySeverity;

    /** Toujours 12 points (mois vides complétés à 0 par le service). */
    private List<MonthlyPointDTO> monthlyTrend;

    /** Alertes calculées sur des décomptes réels strictement positifs. */
    private List<DashboardAlertDTO> alerts;

    /** NULLABLE — renseigné uniquement en vue consolidée (companyId == null). */
    private List<LabelCountDTO> incidentsByMine;

    /** NULLABLE — répartition des risques, null si non exploitable. */
    private List<LabelCountDTO> riskByLevel;

    /**
     * Répartition des incidents par STATUT de traitement (ISO 45001 §10.2).
     * Série EXCLUSIVE : sa somme égale {@code kpis.totalIncidentsYtd}.
     */
    private List<LabelCountDTO> incidentsByStatus;

    /** Suivi des actions correctives de l'exercice (ISO 45001 §10.2). */
    private WorkloadSummary actions;

    /** Suivi de la surveillance planifiée de l'exercice (ISO 45001 §9.1). */
    private WorkloadSummary inspections;

    /**
     * Synthèse d'un plan de charge : volume, avancement et écarts.
     *
     * <p>Structure PARTAGÉE par les actions correctives et les inspections :
     * les deux répondent à la même question de pilotage (« combien en cours,
     * combien de retard ? »). Une seule forme, donc un seul composant d'IHM et
     * un seul jeu d'invariants — deux structures jumelles auraient divergé.</p>
     *
     * <p>Aucun taux n'est pré-calculé ici : {@code total} peut valoir 0, et un
     * pourcentage sur un dénominateur nul serait une invention. L'IHM décide de
     * l'afficher ou non.</p>
     */
    @Data
    @NoArgsConstructor
    public static class WorkloadSummary {

        /** Volume total de l'exercice. Toujours calculable (0 = aucun élément). */
        private Long total;

        /** Éléments dans un statut NON terminal. */
        private Long open;

        /** Éléments dans un statut terminal (clos, annulé, archivé…). */
        private Long closed;

        /**
         * Éléments en retard : échéance/date prévue dépassée et statut non
         * terminal. Les éléments sans échéance en sont exclus — on ne peut pas
         * affirmer qu'un élément sans date est en retard.
         */
        private Long overdue;

        /** Détail par statut, série exclusive. */
        private List<LabelCountDTO> byStatus;
    }

    /**
     * Indicateurs de tête. Sous-objet imbriqué (et non fichier séparé) pour
     * rester aligné sur la liste de DTO livrés.
     */
    @Data
    @NoArgsConstructor
    public static class Kpis {

        /** Incidents de l'année de référence, scopés mine. Toujours calculable. */
        private Long totalIncidentsYtd;

        /**
         * Incidents de l'année N-1, même périmètre. Fourni brut : c'est l'IHM
         * qui calcule l'évolution, le serveur ne pré-mâche pas un pourcentage
         * qui deviendrait faux si l'année N-1 est vide.
         */
        private Long totalIncidentsPreviousYtd;

        /** Presqu'accidents (NonConformity de type NEAR_MISS) de l'année. */
        private Long nearMissCount;

        /**
         * NULLABLE — nombre de jours écoulés depuis le dernier incident GRAVE
         * (au moins un détail de gravité niveau >= 4). null = aucun incident
         * grave enregistré, ce qui n'est PAS « 0 jour ».
         */
        private Integer daysWithoutSeriousIncident;

        /** NULLABLE — valeur DÉCLARÉE, jamais calculée. Voir DeclaredMetricDTO. */
        private DeclaredMetricDTO ltifr;
    }
}
