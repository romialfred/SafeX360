package com.minexpert.hns.entity.audit;

import java.time.LocalDateTime;

import com.minexpert.hns.dto.audit.AreaDTO;
import com.minexpert.hns.entity.parameters.AuditAreas;

import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
public class Area {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "audit_id", nullable = false)
    private Audit audit;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "audit_area_id", nullable = false)
    private AuditAreas auditArea;
    private String purpose;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    /** Cloisonnement par mine : hérité de l'audit de rattachement. */
    private Long companyId;

    public Area(Long id) {
        this.id = id;
    }

    public AreaDTO toDTO() {
        return new AreaDTO(id, audit != null ? audit.getId() : null, auditArea != null ? auditArea.getId() : null,
                purpose, createdAt, updatedAt, companyId);
    }
}
