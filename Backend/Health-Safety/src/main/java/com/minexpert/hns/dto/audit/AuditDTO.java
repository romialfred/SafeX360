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

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class AuditDTO {
    private Long id;
    private String title;
    private String refNumber;
    private List<String> objectives;
    private List<Long> processes;
    private Long scopeId;
    private List<String> methods;
    private String description;
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
        return new Audit(this.id, this.title, this.refNumber, objectives.toString(), processes.toString(),
                new AuditAreas(scopeId), methods.toString(), description, this.category, auditTypes,
                this.references.toString(),
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
