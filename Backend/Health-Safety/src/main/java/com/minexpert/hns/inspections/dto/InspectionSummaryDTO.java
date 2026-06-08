package com.minexpert.hns.inspections.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

import com.minexpert.hns.enums.InspectionStatus;
import com.minexpert.hns.enums.InspectionTemplateType;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Projection legere pour le registre des inspections (liste/tableau). Pas
 * de findings imbriques, juste les compteurs.
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
public class InspectionSummaryDTO {
    private Long id;
    private LocalDate plannedDate;
    private LocalTime startTime;
    private InspectionStatus status;
    private String templateCode;
    private String templateName;
    private InspectionTemplateType templateType;
    private String targetLabel;
    private String siteName;
    private Long primaryInspectorId;
    private LocalDateTime submittedAt;
    private LocalDateTime archivedAt;
    private int totalCheckpoints;
    private int findingsRecorded;
    private int nonConformCount;
}
