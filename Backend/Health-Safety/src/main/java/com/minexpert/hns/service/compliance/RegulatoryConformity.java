package com.minexpert.hns.service.compliance;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;

import com.minexpert.hns.enums.Status;

/**
 * REGISTRES REGLEMENTAIRES — calcul unique du statut de conformite.
 *
 * <p>Les quatre registres mine (licences, autorisations de travaux, inspections
 * d'equipements, obligations reglementaires) partagent la meme semantique de
 * conformite, derivee d'une date d'echeance. Centraliser ce calcul evite que le
 * front et le back — ou deux registres — divergent sur le seuil ou les libelles.
 *
 * <p>Valeurs :
 * <ul>
 *   <li>{@code SUSPENDU}    — enregistrement desactive (statut INACTIVE) ;
 *   <li>{@code A_EVALUER}   — aucune echeance renseignee, conformite non etablie ;
 *   <li>{@code EXPIRE}      — echeance depassee ;
 *   <li>{@code A_RENOUVELER}— echeance dans les {@value #RENEWAL_WINDOW_DAYS} jours ;
 *   <li>{@code CONFORME}    — echeance au-dela de la fenetre de renouvellement.
 * </ul>
 */
public final class RegulatoryConformity {

    private RegulatoryConformity() {
    }

    /** Fenetre d'alerte avant echeance (jours) : au-dela on est « conforme ». */
    public static final int RENEWAL_WINDOW_DAYS = 60;

    public static final String CONFORME = "CONFORME";
    public static final String A_RENOUVELER = "A_RENOUVELER";
    public static final String EXPIRE = "EXPIRE";
    public static final String A_EVALUER = "A_EVALUER";
    public static final String SUSPENDU = "SUSPENDU";

    /**
     * @param status   cycle de vie de l'enregistrement (ACTIVE / INACTIVE)
     * @param dueDate  date d'echeance qui porte la conformite (expiration, prochaine
     *                 inspection, prochaine revue…) — {@code null} = non evaluee
     * @param today    date de reference (injectable pour les tests)
     */
    public static String of(Status status, LocalDate dueDate, LocalDate today) {
        if (status == Status.INACTIVE) {
            return SUSPENDU;
        }
        if (dueDate == null) {
            return A_EVALUER;
        }
        LocalDate ref = today != null ? today : LocalDate.now();
        if (dueDate.isBefore(ref)) {
            return EXPIRE;
        }
        long days = ChronoUnit.DAYS.between(ref, dueDate);
        return days <= RENEWAL_WINDOW_DAYS ? A_RENOUVELER : CONFORME;
    }

    /** Nombre de jours restants avant l'echeance (negatif si depassee), ou null. */
    public static Long daysToDue(LocalDate dueDate, LocalDate today) {
        if (dueDate == null) {
            return null;
        }
        return ChronoUnit.DAYS.between(today != null ? today : LocalDate.now(), dueDate);
    }

    // ─── Autorisations de travaux (permis a fenetre temporelle) ────────────────
    // Une autorisation de travaux (excavation, hauteur, forage, dynamitage…) n'est
    // pas « renouvelable » comme une licence : elle est valide sur une fenetre, puis
    // close. Son cycle de vie a donc ses propres etats.

    public static final String EN_COURS = "EN_COURS";
    public static final String PLANIFIE = "PLANIFIE";
    public static final String CLOTURE = "CLOTURE";

    /**
     * @param status    ACTIVE (permis vivant) / INACTIVE (cloture manuellement)
     * @param validFrom debut de validite (null = non planifie)
     * @param validTo   fin de validite (null = non evaluee)
     * @param today     date de reference (injectable pour les tests)
     */
    public static String authorizationStatus(Status status, LocalDate validFrom, LocalDate validTo,
            LocalDate today) {
        if (status == Status.INACTIVE) {
            return CLOTURE;
        }
        LocalDate ref = today != null ? today : LocalDate.now();
        if (validTo == null) {
            return A_EVALUER;
        }
        if (validTo.isBefore(ref)) {
            return EXPIRE;
        }
        if (validFrom != null && validFrom.isAfter(ref)) {
            return PLANIFIE;
        }
        return EN_COURS;
    }
}
