package com.minexpert.hns.dto.audit;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * LOT 52 — DTO d'une question type de checklist d'audit.
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
public class AuditChecklistTemplateDTO {
    private Long id;
    private String referential;
    private String clause;
    private String question;
    private String guidance;
    private Integer orderIndex;
    private Boolean active;
}
