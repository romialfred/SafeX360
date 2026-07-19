package com.minexpert.hns.dto.audit;

import java.time.LocalDateTime;

import com.minexpert.hns.entity.audit.AuditProgram;
import com.minexpert.hns.enums.AuditProgramStatus;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * LOT 52 — DTO du programme d'audit annuel (ISO 19011:2026, programme d'audit).
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
public class AuditProgramDTO {
    private Long id;
    private Integer year;
    private String title;
    private String objectives;
    private String scope;
    private String resources;
    private AuditProgramStatus status;
    private Long approvedBy;
    private LocalDateTime approvedAt;
    private Long companyId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public AuditProgram toEntity() {
        return new AuditProgram(id, year, title, objectives, scope, resources, status,
                approvedBy, approvedAt, companyId, createdAt, updatedAt);
    }
}
