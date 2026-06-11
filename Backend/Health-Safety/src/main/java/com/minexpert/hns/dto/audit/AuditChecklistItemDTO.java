package com.minexpert.hns.dto.audit;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * LOT 52 — DTO d'une ligne de checklist instanciée pour un audit.
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
public class AuditChecklistItemDTO {
    private Long id;
    private Long auditId;
    private Long templateId;
    private String referential;
    private String clause;
    private String question;
    /** CONFORME / NON_CONFORME / NON_APPLICABLE / A_EVALUER. */
    private String result;
    private String comment;
    private String evidence;
    private Long observationId;
    private LocalDateTime updatedAt;
}
