package com.minexpert.hns.dto.audit;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import com.minexpert.hns.entity.audit.Audit;
import com.minexpert.hns.entity.parameters.AuditAreas;
import com.minexpert.hns.enums.AuditCategory;
import com.minexpert.hns.enums.AuditStatus;
import com.minexpert.hns.enums.PlanningStatus;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class AuditDTO {
    private Long id;
    @NotBlank(message = "title is required")
    @Size(max = 255, message = "title must not exceed 255 characters")
    private String title;
    private String refNumber;
    private List<String> objectives;
    private List<Long> processes;
    private Long scopeId;
    private List<String> methods;
    private String description;
    @NotNull(message = "category is required")
    private AuditCategory category;
    private Map<String, List<String>> auditTypes;
    private List<String> references;
    private LocalDate startDate;
    private LocalDate endDate;
    private AuditStatus status;
    private PlanningStatus planningStatus;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    /** LOT 52 — rattachement optionnel au programme d'audit annuel. */
    private Long programId;

    /** LOT 52 — score de priorité basé risques. */
    private Integer riskScore;

    public Audit toEntity() {
        return new Audit(this.id, this.title, this.refNumber,
                com.minexpert.hns.utility.StringListConverter.listToString(objectives),
                com.minexpert.hns.utility.StringListConverter.listToString(processes),
                new AuditAreas(scopeId), com.minexpert.hns.utility.StringListConverter.listToString(methods),
                description, this.category, auditTypes,
                com.minexpert.hns.utility.StringListConverter.listToString(this.references),
                this.startDate,
                this.endDate, this.status, this.planningStatus, this.createdAt, this.updatedAt,
                this.programId, this.riskScore);
    }

    public AuditDetails toDetails() {
        return new AuditDetails(id, title, refNumber, objectives, processes, scopeId, methods, description, category,
                auditTypes, references, startDate, endDate, status, planningStatus,
                createdAt, updatedAt);
    }
}
