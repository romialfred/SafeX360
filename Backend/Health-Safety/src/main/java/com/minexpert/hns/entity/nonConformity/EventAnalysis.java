package com.minexpert.hns.entity.nonConformity;

import java.time.LocalDate;
import java.time.LocalDateTime;

import com.minexpert.hns.dto.nonConformity.EventAnalysisDTO;
import com.minexpert.hns.utility.StringListConverter;

import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Lob;
import jakarta.persistence.OneToOne;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
public class EventAnalysis {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String method;
    private String origin;
    @Lob
    private String description;
    @Lob
    private String individualFactors;
    @Lob
    private String technicalFactors;
    @Lob
    private String organizationalFactors;
    @Lob
    private String rootCauses;
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "non_conformity_id", nullable = false)
    private NonConformity nonConformity;
    private String team;

    private LocalDate startDate;
    private LocalDate deadline;
    private String priority;

    private String severityLevel;
    private String analysisStatus;
    @Lob
    private String summary;
    @Lob
    private String conclusion;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public EventAnalysisDTO toDTO() {
        return new EventAnalysisDTO(id, method, origin, description, individualFactors, technicalFactors,
                organizationalFactors, rootCauses, nonConformity != null ? nonConformity.getId() : null,
                StringListConverter.convertStringToParticipantsDTO(team), startDate, deadline, priority,
                severityLevel, analysisStatus, summary, conclusion, createdAt, updatedAt);
    }

    public void updateFromDTO(EventAnalysisDTO dto) {
        this.origin = dto.getOrigin();
        this.description = dto.getDescription();
        this.method = dto.getMethod();
        this.individualFactors = dto.getIndividualFactors();
        this.technicalFactors = dto.getTechnicalFactors();
        this.organizationalFactors = dto.getOrganizationalFactors();
        this.rootCauses = dto.getRootCauses();
        this.team = StringListConverter.convertParticipantsToString(dto.getTeam());
        this.startDate = dto.getStartDate();
        this.deadline = dto.getDeadline();
        this.priority = dto.getPriority();
        this.severityLevel = dto.getSeverityLevel();
        this.analysisStatus = dto.getStatus();
        this.summary = dto.getSummary();
        this.conclusion = dto.getConclusion();
    }
}
