package com.minexpert.hns.dto.chemicalrisks;

import com.minexpert.hns.entity.chemicalrisks.ChemicalRisk;
import com.minexpert.hns.entity.parameters.WorkProcess;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ChemicalRiskDTO {
    private Long id;
    private String title;
    private String description;
    private Long departmentId;
    private Long workProcessId;
    private String hazardSource;
    private String riskLevel;
    private String potentialConsequences;
    private Long ownerId;
    private LocalDate reviewDate;
    private String status;

    // Extra chemical risk fields
    private String chemicalName;
    private String casNumber;
    private String classification;
    private String methodOfUse;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // ISO 45001 — Hazard identification (B1)
    private String activityType;
    private String hazardCategory;
    private String personsExposed;
    private Integer exposureCount;

    // ISO 45001 §6.1.3 — Legal & other requirements + next review (C1)
    private String legalRequirements;
    private LocalDate nextReviewDate;

    // Cloisonnement par mine (companyId) — en DERNIER pour @AllArgsConstructor
    private Long companyId;

    public ChemicalRisk toEntity() {
        return new ChemicalRisk(
                this.id,
                this.title,
                this.description,
                this.departmentId,
                // Garde null : un work process laisse vide donnait une association
                // @ManyToOne vers une entite au @Id null -> a la sauvegarde Hibernate
                // levait « unsaved transient instance » (500 a l'enregistrement).
                // On stocke null si aucun process n'est selectionne.
                workProcessId != null ? new WorkProcess(workProcessId) : null,
                this.hazardSource,
                this.riskLevel,
                this.potentialConsequences,
                this.ownerId,
                this.reviewDate,
                this.status,
                this.chemicalName,
                this.casNumber,
                this.classification,
                this.methodOfUse,
                this.createdAt,
                this.updatedAt,
                this.activityType,
                this.hazardCategory,
                this.personsExposed,
                this.exposureCount,
                this.legalRequirements,
                this.nextReviewDate,
                this.companyId);
    }
}

