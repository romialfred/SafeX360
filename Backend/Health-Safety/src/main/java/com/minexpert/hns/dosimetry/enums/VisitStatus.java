package com.minexpert.hns.dosimetry.enums;

/**
 * Statut du cycle de vie d'une {@link com.minexpert.hns.dosimetry.entity.MedicalVisit}.
 *
 * <p>Transitions autorisees :
 * <pre>
 *   SCHEDULED -> PERFORMED   (medecin saisit la visite reelle)
 *   SCHEDULED -> CANCELLED   (annulation explicite avec motif)
 *   SCHEDULED -> MISSED      (date depassee sans realisation - batch)
 * </pre>
 *
 * <p>Une visite passee en {@link #PERFORMED} devient APPEND-ONLY : les champs
 * {@code performedDate}, {@code generalConclusion} et {@code detailedReport} sont
 * verrouilles (cf. trigger SQL).
 */
public enum VisitStatus {
    SCHEDULED,
    PERFORMED,
    CANCELLED,
    MISSED
}
