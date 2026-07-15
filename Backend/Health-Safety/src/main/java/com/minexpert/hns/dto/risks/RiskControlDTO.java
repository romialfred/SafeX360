package com.minexpert.hns.dto.risks;

import com.minexpert.hns.entity.risks.RiskControl;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class RiskControlDTO {
    private Long id;
    private String sourceType; // 'RISK' or 'CHEMICAL'
    private Long riskId;
    private String controlType; // ELIMINATION/SUBSTITUTION/ENGINEERING/ADMINISTRATIVE/PPE
    private String description;
    private Long responsibleId;
    private LocalDate dueDate;
    private String status; // PLANNED/IN_PROGRESS/DONE
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Cloisonnement par mine (companyId) — en DERNIER pour @AllArgsConstructor
    private Long companyId;

    public RiskControl toEntity() {
        return new RiskControl(
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
