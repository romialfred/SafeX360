package com.minexpert.hns.blast.dto;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import com.minexpert.hns.blast.enums.BlastStatus;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Agregat consolide du tableau de bord Blast Management (P7).
 *
 * <p>Toutes les valeurs sont calculees pour une mine donnee, sur la base du
 * mois courant pour les KPI et statusBreakdown ; sur les 24h pour
 * upcomingToday ; sur les 7 prochains jours pour upcomingThisWeek.
 *
 * <p>Donnees STRICTEMENT agregees : aucune donnee personnelle (boutefeu,
 * destinataire) n'apparait directement — seuls des compteurs et des
 * references fonctionnelles ({@link BlastListItemDTO}) sont exposes.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BlastDashboardDTO {

    /** Tirs prevus dans la journee (00:00 → 23:59) de la mine. */
    @Builder.Default
    private List<BlastListItemDTO> upcomingToday = List.of();

    /** Compte total des tirs prevus sur les 7 prochains jours glissants. */
    private int upcomingThisWeekCount;

    /** 10 premiers tirs prevus sur les 7 prochains jours (ordre chronologique). */
    @Builder.Default
    private List<BlastListItemDTO> upcomingThisWeek = List.of();

    /** Prochain tir CONFIRMED + compte a rebours en secondes. Null si aucun. */
    private NextBlastSummary nextConfirmedBlast;

    /** Repartition des tirs par statut sur le mois courant. */
    @Builder.Default
    private Map<BlastStatus, Integer> statusBreakdown = new HashMap<>();

    /** Etat des notifications (compteurs sur le mois). */
    private NotificationsState notificationsState;

    /** 5 derniers tirs cloturés (ALL_CLEAR/CANCELLED) — chronologique decroissant. */
    @Builder.Default
    private List<BlastListItemDTO> lastFinishedBlasts = List.of();

    /** Indicateurs cles du mois courant. */
    private DashboardKpis kpis;

    /**
     * Resume du prochain tir CONFIRMED.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class NextBlastSummary {
        private Long id;
        private String reference;
        private LocalDateTime scheduledAt;
        /** Zone d'alerte ou perimetre concise (alarmZoneScope ou pit). */
        private String zone;
        /** Secondes restantes jusqu'au tir (negatif si depasse). */
        private long secondsUntil;
        private BlastStatus status;
    }

    /**
     * Compteurs sur l'etat des jobs de notification du mois courant.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class NotificationsState {
        /** Jobs envoyes avec succes (status SENT). */
        private int sent;
        /** Jobs encore en attente d'execution (status SCHEDULED). */
        private int scheduled;
        /** Jobs en echec apres epuisement des tentatives (status FAILED). */
        private int failed;
    }

    /**
     * Indicateurs cles agreges du mois courant.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DashboardKpis {
        /** Nombre de tirs tous statuts confondus prevus ou realises ce mois. */
        private int blastsThisMonth;
        /** Somme des explosifs consommes (kg) sur tirs FIRED + ALL_CLEAR du mois. */
        private double totalExplosivesKg;
        /** Charge specifique moyenne (kg/m3) sur les tirs realises du mois. */
        private double avgPowderFactor;
        /** Taux de tirs realises a l'heure (+/-15 min) — pourcentage 0-100. */
        private double onTimeRate;
        /** Tirs en statut MISFIRE durant le mois. */
        private int misfireCount;
        /** Tirs prevus aujourd'hui (raccourci utile pour le hero). */
        private int blastsToday;
    }
}
