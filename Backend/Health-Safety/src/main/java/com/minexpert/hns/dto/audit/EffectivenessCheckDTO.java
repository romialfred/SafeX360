package com.minexpert.hns.dto.audit;

import java.time.LocalDate;
import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * LOT 52 — DTO d'une vérification d'efficacité (ISO 19011:2026 — suivi des audits).
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
public class EffectivenessCheckDTO {
    private Long id;
    private Long recommendationId;
    /** Titre de la recommandation — rempli en lecture pour les listes. */
    private String recommendationTitle;
    private LocalDate dueDate;
    private Long evaluatorEmployeeId;
    /** null / EFFICACE / PARTIELLEMENT_EFFICACE / INEFFICACE. */
    private String verdict;
    private String comment;
    private LocalDateTime checkedAt;
    private LocalDateTime createdAt;

    /** Cloisonnement par mine : hérité de la recommandation / de l'audit de rattachement. */
    private Long companyId;
}
