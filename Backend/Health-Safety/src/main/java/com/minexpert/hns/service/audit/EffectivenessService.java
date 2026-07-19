package com.minexpert.hns.service.audit;

import java.time.LocalDate;
import java.util.List;

import com.minexpert.hns.dto.audit.EffectivenessCheckDTO;
import com.minexpert.hns.exception.HSException;

/**
 * LOT 52 — Vérification d'efficacité des recommandations d'audit
 * (ISO 19011:2026 — suivi des audits et amélioration du programme).
 */
public interface EffectivenessService {

    /** Planifie une vérification d'efficacité pour une recommandation. */
    Long planCheck(Long recommendationId, LocalDate dueDate, Long evaluatorEmployeeId) throws HSException;

    /**
     * Rend le verdict (EFFICACE / PARTIELLEMENT_EFFICACE / INEFFICACE).
     * Un verdict INEFFICACE rouvre automatiquement la recommandation
     * (IN_PROGRESS + followup automatique de réouverture).
     */
    void concludeCheck(Long checkId, String verdict, String comment) throws HSException;

    /** Vérifications planifiées sans verdict, triées par échéance (cloisonné par mine). */
    List<EffectivenessCheckDTO> getPendingChecks(Long companyId) throws HSException;

    /** Vérifications liées à une recommandation. */
    List<EffectivenessCheckDTO> getChecksByRecommendation(Long recommendationId) throws HSException;
}
