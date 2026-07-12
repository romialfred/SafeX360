package com.minexpert.hns.dto.nonConformity;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import com.minexpert.hns.dto.ParticipantDTO;
import com.minexpert.hns.entity.nonConformity.EventAnalysis;
import com.minexpert.hns.entity.nonConformity.NonConformity;
import com.minexpert.hns.utility.StringListConverter;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class EventAnalysisDTO {
    private Long id;
    private String method;
    private String origin;
    private String description;
    private String individualFactors;
    private String technicalFactors;
    private String organizationalFactors;
    private String rootCauses;

    private Long nonConformityId;

    private List<ParticipantDTO> team;
    private LocalDate startDate;
    private LocalDate deadline;
    private String priority;

    private String severityLevel;
    private String status;
    private String summary;
    private String conclusion;
    // JSON des champs spécifiques à la méthode d'analyse (voir EventAnalysis).
    private String methodData;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public EventAnalysis toEntity() {
        return new EventAnalysis(id, method, origin, description, individualFactors, technicalFactors,
                organizationalFactors, rootCauses, new NonConformity(nonConformityId),
                StringListConverter.convertParticipantsToString(team), startDate, deadline,
                priority, severityLevel, status, summary, conclusion, methodData, createdAt, updatedAt);
    }
}