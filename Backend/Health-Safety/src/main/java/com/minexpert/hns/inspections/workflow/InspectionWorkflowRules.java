package com.minexpert.hns.inspections.workflow;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.EnumMap;
import java.util.EnumSet;
import java.util.Map;
import java.util.Set;

import com.minexpert.hns.enums.InspectionStatus;

/**
 * SOURCE DE VERITE UNIQUE des regles de workflow d'une inspection (ISO 45001 9.1).
 *
 * <p>Il existe DEUX chemins d'ecriture du statut : le service metier garde
 * ({@code InspectionWorkflowService.start/submit/decide}) et un setter brut
 * ({@code GeneralInspectionService.updateInspectionStatus}) utilise par la
 * sauvegarde de processus et l'historique. Le second ne controlait RIEN : un
 * client pouvait poster n'importe quel statut, ce qui contournait a la fois la
 * machine a etats et le verrou de date planifiee — le verrou ne vivait donc que
 * dans l'IHM (« cacher n'est pas interdire »). Ces regles sont centralisees ici
 * pour que les deux chemins appliquent EXACTEMENT la meme loi.</p>
 *
 * <p>Workflow : SCHEDULED → IN_PROGRESS → SUBMITTED → APPROVED → ARCHIVED,
 * avec REJECTED → IN_PROGRESS. Les statuts legacy (PENDING ≈ SCHEDULED,
 * COMPLETED ≈ APPROVED, CANCELLED) restent acceptes pour ne pas bloquer les
 * inspections anterieures a la refonte.</p>
 */
public final class InspectionWorkflowRules {

    /** Statuts a partir desquels l'inspection est en cours d'execution terrain. */
    public static final Set<InspectionStatus> EXECUTION_STATES =
            EnumSet.of(InspectionStatus.IN_PROGRESS);

    private static final Map<InspectionStatus, Set<InspectionStatus>> ALLOWED =
            new EnumMap<>(InspectionStatus.class);

    static {
        // ── Planifiee (legacy PENDING et nouveau SCHEDULED) ──
        ALLOWED.put(InspectionStatus.PENDING,
                EnumSet.of(InspectionStatus.SCHEDULED, InspectionStatus.IN_PROGRESS, InspectionStatus.CANCELLED));
        ALLOWED.put(InspectionStatus.SCHEDULED,
                EnumSet.of(InspectionStatus.IN_PROGRESS, InspectionStatus.CANCELLED));

        // ── Execution terrain ──
        ALLOWED.put(InspectionStatus.IN_PROGRESS,
                EnumSet.of(InspectionStatus.SUBMITTED, InspectionStatus.COMPLETED, InspectionStatus.CANCELLED));

        // ── Validation ──
        ALLOWED.put(InspectionStatus.SUBMITTED,
                EnumSet.of(InspectionStatus.APPROVED, InspectionStatus.REJECTED));
        ALLOWED.put(InspectionStatus.REJECTED,
                EnumSet.of(InspectionStatus.IN_PROGRESS, InspectionStatus.CANCELLED));

        // ── Cloture ──
        ALLOWED.put(InspectionStatus.APPROVED, EnumSet.of(InspectionStatus.ARCHIVED));
        ALLOWED.put(InspectionStatus.COMPLETED, EnumSet.of(InspectionStatus.ARCHIVED));

        // ── Etats terminaux : plus aucune transition sortante ──
        ALLOWED.put(InspectionStatus.ARCHIVED, EnumSet.noneOf(InspectionStatus.class));
        ALLOWED.put(InspectionStatus.CANCELLED, EnumSet.noneOf(InspectionStatus.class));
    }

    private InspectionWorkflowRules() {
        // classe utilitaire
    }

    /**
     * Une transition est autorisee si elle figure dans la table, OU si elle est
     * idempotente (meme statut). L'idempotence est indispensable : l'enregistrement
     * d'un brouillon de processus renvoie le statut courant a chaque sauvegarde —
     * le refuser casserait la saisie terrain.
     */
    public static boolean isTransitionAllowed(InspectionStatus from, InspectionStatus to) {
        if (to == null) {
            return false;
        }
        if (from == null || from == to) {
            return true; // donnee legacy sans statut, ou no-op
        }
        return ALLOWED.getOrDefault(from, EnumSet.noneOf(InspectionStatus.class)).contains(to);
    }

    /** Leve une IllegalStateException (→ 409) si la transition est interdite. */
    public static void assertTransitionAllowed(InspectionStatus from, InspectionStatus to) {
        if (!isTransitionAllowed(from, to)) {
            throw new IllegalStateException(
                    "Changement de statut refuse : " + from + " → " + to
                            + " n est pas une transition autorisee du workflow d inspection.");
        }
    }

    /**
     * Verrou de date planifiee : on ne DEMARRE pas une inspection avant sa date.
     *
     * <p>Le RETARD n'est jamais bloque — le bloquer pousserait a creer une fausse
     * inspection a la bonne date. Avancer une inspection = la REPLANIFIER, acte
     * trace. Date nulle (legacy) : pas de blocage.</p>
     */
    public static void assertNotBeforePlannedDate(LocalDate planned, InspectionStatus target) {
        if (planned == null || !EXECUTION_STATES.contains(target)) {
            return;
        }
        if (planned.isAfter(LocalDate.now())) {
            throw new IllegalStateException(
                    "Inspection planifiee le " + planned.format(DateTimeFormatter.ofPattern("dd/MM/yyyy"))
                            + " : elle ne peut pas demarrer avant cette date. "
                            + "Replanifiez-la si l execution doit etre avancee.");
        }
    }
}
