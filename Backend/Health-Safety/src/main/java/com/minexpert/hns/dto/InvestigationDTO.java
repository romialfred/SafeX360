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
    private Long companyId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public Investigation toEntity() {
        return new Investigation(id, method, startDate, endDate, StringListConverter.convertParticipantsToString(team),
                asStored(humanCauses), humanAnalysis,
                asStored(taskCauses), taskAnalysis, asStored(workingCauses), workingAnalysis,
                asStored(organizationCauses), organizationAnalysis,
                null, report, progress, status,
                // Champs de gouvernance (validated/reviewedBy/reviewedAt/validationComment) :
                // NON portes par le DTO editable — poses par validateInvestigation et
                // PRESERVES a l'update (voir updateInvestigation).
                null, null, null, null,
                new Incident(incidentId), companyId, createdAt, updatedAt);
    }

    /**
     * Serialise une liste de causes au format stocke (repr. Java List, ex.
     * « [cause1, cause2] »). Garde null : une section de causes laissee vide
     * par l'utilisateur donnait un NullPointerException -> 500 « erreur
     * generique » a la soumission. Une liste absente est stockee « [] ».
     */
    private static String asStored(List<String> causes) {
        return (causes != null ? causes : List.<String>of()).toString();
    }
}
