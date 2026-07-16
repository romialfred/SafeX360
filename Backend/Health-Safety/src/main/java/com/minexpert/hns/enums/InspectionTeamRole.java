package com.minexpert.hns.enums;

/**
 * Role d'un membre au sein de l'equipe d'inspection (D4 de la refonte 2026-07).
 *
 * <p>A ne pas confondre avec {@code InspectionApproval.decision} qui porte la
 * DECISION de validation d'un membre, et non son role dans l'equipe.</p>
 *
 * <ul>
 *   <li>{@code LEAD}            — Inspecteur principal. <b>Exactement un par
 *       inspection</b> : son {@code employeeId} est recopie dans
 *       {@code GeneralInspection.primaryInspectorId} (retro-compat avec
 *       {@code start()} et la generation du PDF).</li>
 *   <li>{@code INSPECTOR}       — Inspecteur (co-executant sur le terrain).</li>
 *   <li>{@code SPECIALIST}      — Expert metier (mecanique, electricite,
 *       geotechnique...) sollicite ponctuellement.</li>
 *   <li>{@code EQUIPMENT_OWNER} — Responsable de l'equipement inspecte.</li>
 *   <li>{@code OBSERVER}        — Observateur (formation, audit croise,
 *       representant du personnel). Sans role d'execution.</li>
 * </ul>
 *
 * <p>La valeur est persistee en String (colonne {@code role}, longueur 24) et
 * non en ordinal : l'ajout d'un role futur ne casse donc pas les donnees
 * existantes.</p>
 */
public enum InspectionTeamRole {
    LEAD,
    INSPECTOR,
    SPECIALIST,
    EQUIPMENT_OWNER,
    OBSERVER;

    /**
     * Parse tolerant (trim + majuscules) d'une valeur venant du client.
     *
     * @param raw valeur brute (nullable)
     * @return le role correspondant, ou {@code null} si {@code raw} est vide
     * @throws IllegalArgumentException si la valeur est non vide mais inconnue
     */
    public static InspectionTeamRole parse(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        try {
            return InspectionTeamRole.valueOf(raw.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Role d'equipe invalide : '" + raw
                    + "'. Valeurs attendues : LEAD, INSPECTOR, SPECIALIST, EQUIPMENT_OWNER, OBSERVER.");
        }
    }
}
