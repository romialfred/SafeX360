package com.minexpert.hns.entity.audit;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import com.minexpert.hns.dto.audit.AuditDTO;
import com.minexpert.hns.entity.parameters.AuditAreas;
import com.minexpert.hns.enums.AuditCategory;
import com.minexpert.hns.enums.AuditStatus;
import com.minexpert.hns.enums.PlanningStatus;
import com.minexpert.hns.utility.StringListConverter;

import jakarta.persistence.Column;
import jakarta.persistence.Convert;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Lob;
import jakarta.persistence.ManyToOne;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
public class Audit {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String title;
    private String refNumber;
    private String objectives;
    private String processes;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "scope_id", nullable = false)
    private AuditAreas scope;
    private String methods;
    @Lob
    private String description;
    private AuditCategory category;

    @Column(columnDefinition = "json")
    @Convert(converter = AuditTypeDataConverter.class)
    private Map<String, List<String>> auditTypes;
    @Column(name = "`references`")
    private String references;
    private LocalDate startDate;
    private LocalDate endDate;
    private AuditStatus status;
    private PlanningStatus planningStatus;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public Audit(Long id) {
        this.id = id;
    }

    public AuditDTO toDTO() {
        return new AuditDTO(id, title, refNumber,
                StringListConverter.convertToStringList(objectives),
                StringListConverter.convertToLongList(processes), scope != null ? scope.getId() : null,
                StringListConverter.convertToStringList(methods), description, category, auditTypes,
                StringListConverter.convertToStringList(references),
                startDate, endDate, status, planningStatus, createdAt, updatedAt);
    }

    public Audit update(AuditDTO auditDTO) {
        this.title = auditDTO.getTitle();
        this.objectives = auditDTO.getObjectives().toString();
        this.processes = auditDTO.getProcesses().toString();
        this.scope = auditDTO.getScopeId() != null ? new AuditAreas(auditDTO.getScopeId()) : null;
        this.methods = auditDTO.getMethods().toString();
        this.description = auditDTO.getDescription();
        this.category = auditDTO.getCategory();
        this.auditTypes = auditDTO.getAuditTypes();
        this.references = auditDTO.getReferences().toString();
        this.startDate = auditDTO.getStartDate();
        this.endDate = auditDTO.getEndDate();
        this.setUpdatedAt(LocalDateTime.now());
        return this;
    }
}
