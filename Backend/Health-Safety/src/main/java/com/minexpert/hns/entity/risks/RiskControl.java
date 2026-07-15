package com.minexpert.hns.entity.risks;

import com.minexpert.hns.dto.risks.RiskControlDTO;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * ISO 45001 — Hierarchy of controls (B3).
 * Generic control attached to either a Risk or a ChemicalRisk
 * (discriminated by {@code sourceType}).
 */
@Entity
@Table(name = "risk_control")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class RiskControl {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 'RISK' or 'CHEMICAL'
    @Column(name = "source_type")
    private String sourceType;

    // id of the Risk or ChemicalRisk it belongs to
    @Column(name = "risk_id")
    private Long riskId;

    // ELIMINATION / SUBSTITUTION / ENGINEERING / ADMINISTRATIVE / PPE
    @Column(name = "control_type")
    private String controlType;

    @Column(name = "description", length = 1000)
    private String description;

    @Column(name = "responsible_id")
    private Long responsibleId;

    @Column(name = "due_date")
    private LocalDate dueDate;

    // PLANNED / IN_PROGRESS / DONE
    @Column(name = "status")
    private String status;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Cloisonnement par mine (companyId) — en DERNIER pour @AllArgsConstructor
    @Column(name = "company_id")
    private Long companyId;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        if (this.status == null) {
            this.status = "PLANNED";
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    public RiskControlDTO toDTO() {
        return new RiskControlDTO(
                this.id,
                this.sourceType,
                this.riskId,
                this.controlType,
                this.description,
                this.responsibleId,
                this.dueDate,
                this.status,
                this.createdAt,
                this.updatedAt,
                this.companyId);
    }
}
