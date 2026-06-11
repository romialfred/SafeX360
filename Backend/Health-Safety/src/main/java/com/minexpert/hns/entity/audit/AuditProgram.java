package com.minexpert.hns.entity.audit;

import java.time.LocalDateTime;

import com.minexpert.hns.dto.audit.AuditProgramDTO;
import com.minexpert.hns.enums.AuditProgramStatus;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Lob;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * LOT 52 — Programme d'audit annuel (ISO 19011:2018 §5).
 *
 * <p>Regroupe les audits planifiés sur une année : objectifs du programme,
 * périmètre global, ressources allouées et cycle d'approbation
 * (PROPOSED → APPROVED → CLOSED).
 */
@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
public class AuditProgram {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Année couverte par le programme (colonne renommée : YEAR est sensible en SQL). */
    @Column(name = "program_year")
    private Integer year;

    private String title;
    @Lob
    private String objectives;
    @Lob
    private String scope;
    @Lob
    private String resources;

    @Enumerated(EnumType.STRING)
    private AuditProgramStatus status;

    private Long approvedBy;
    private LocalDateTime approvedAt;
    private Long companyId;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public AuditProgram(Long id) {
        this.id = id;
    }

    public AuditProgramDTO toDTO() {
        return new AuditProgramDTO(id, year, title, objectives, scope, resources, status,
                approvedBy, approvedAt, companyId, createdAt, updatedAt);
    }
}
