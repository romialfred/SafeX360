package com.minexpert.hns.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import com.minexpert.hns.entity.incident.Incident;
import com.minexpert.hns.entity.incident.Investigation;
import com.minexpert.hns.enums.InvestigationStatus;
import com.minexpert.hns.utility.StringListConverter;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class InvestigationDTO {
    private Long id;
    private String method;
    private LocalDate startDate;
    private LocalDate endDate;
    private List<ParticipantDTO> team;
    private List<String> humanCauses;
    private String humanAnalysis;
    private List<String> taskCauses;
    private String taskAnalysis;

    private List<String> workingCauses;
    private String workingAnalysis;
    private List<String> organizationCauses;

    private String organizationAnalysis;
    private List<MediaDTO> evidence;
    private String report;
    private Integer progress;
    private InvestigationStatus status;
    private Long incidentId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public Investigation toEntity() {
        return new Investigation(id, method, startDate, endDate, StringListConverter.convertParticipantsToString(team),
                humanCauses.toString(), humanAnalysis,
                taskCauses.toString(), taskAnalysis, workingCauses.toString(), workingAnalysis,
                organizationCauses.toString(), organizationAnalysis,
                null, report, progress, status, new Incident(incidentId), createdAt, updatedAt);
    }
}
