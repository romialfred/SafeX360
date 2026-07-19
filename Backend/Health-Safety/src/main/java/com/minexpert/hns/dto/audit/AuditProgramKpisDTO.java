package com.minexpert.hns.dto.audit;

import java.util.Map;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * LOT 52 — Indicateurs de pilotage d'un programme d'audit (ISO 19011:2026 — surveillance du programme).
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
public class AuditProgramKpisDTO {
    private long totalAudits;
    /** Audits clôturés (status CLOSED). */
    private long realises;
    /** Pourcentage de réalisation (0-100, une décimale). */
    private double tauxRealisation;
    /** Constats groupés par classification ISO (NON_CLASSE si absente). */
    private Map<String, Long> constatsParClassification;
    /** Top 10 des clauses les plus citées dans les constats. */
    private Map<String, Long> constatsParClause;
    /** Recommandations non terminées. */
    private long actionsOuvertes;
    /** Recommandations non terminées dont l'échéance est dépassée. */
    private long actionsEnRetard;
    /** Vérifications d'efficacité sans verdict. */
    private long verificationsEfficacitePendantes;
}
