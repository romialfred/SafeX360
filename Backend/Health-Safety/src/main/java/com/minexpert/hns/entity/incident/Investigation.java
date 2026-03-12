package com.minexpert.hns.entity.incident;

import java.time.LocalDate;
import java.time.LocalDateTime;

import com.minexpert.hns.dto.InvestigationDTO;
import com.minexpert.hns.dto.response.InvestResponse;
import com.minexpert.hns.enums.InvestigationStatus;
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

@Entity(name = "incident_investigation")
@Data
@AllArgsConstructor
@NoArgsConstructor
public class Investigation {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String method;
    private LocalDate startDate;
    private LocalDate endDate;
    @Lob
    private String team;
    private String humanCauses;
    @Lob
    private String humanAnalysis;
    private String taskCauses;
    @Lob
    private String taskAnalysis;

    private String workingCauses;
    @Lob
    private String workingAnalysis;
    private String organizationCauses;
    @Lob
    private String organizationAnalysis;
    private String evidence;
    @Lob
    private String report;
    private Integer progress;
    private InvestigationStatus status;
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "incident_id", nullable = false)
    private Incident incident;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public Investigation(Long id) {
        this.id = id;
    }

    public InvestResponse toResponse() {
        return new InvestResponse(id, method, startDate, endDate,
                StringListConverter.convertStringToParticipants(team),
                StringListConverter.convertToStringList(humanCauses), humanAnalysis,
                StringListConverter.convertToStringList(taskCauses), taskAnalysis,
                StringListConverter.convertToStringList(workingCauses), workingAnalysis,
                StringListConverter.convertToStringList(organizationCauses), organizationAnalysis,
                null, report, progress, status, incident.getId(), createdAt, updatedAt);
    }
}
