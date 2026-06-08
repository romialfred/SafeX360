package com.minexpert.hns.inspections.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

import com.minexpert.hns.enums.InspectionStatus;
import com.minexpert.hns.enums.InspectionTemplateType;

import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Vue detaillee complete d'une inspection : metadonnees + template +
 * findings + approvals. Utilisee pour la page d'execution mobile et la page
 * de detail web.
 */
@Data
@NoArgsConstructor
public class InspectionDetailDTO {

    private Long id;
    private Long activityId;
    private String activityTitle;
    private Long siteId;
    private String siteName;
    private LocalDate plannedDate;
    private LocalTime startTime;
    private LocalTime endTime;
    private String description;
    private String objectives;
    private InspectionStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // ── Template ──
    private Long templateId;
    private String templateCode;
    private String templateName;
    private InspectionTemplateType templateType;

    // ── Cible ──
    private Long targetRefId;
    private String targetLabel;

    // ── Workflow ──
    private LocalDateTime submittedAt;
    private LocalDateTime approvedAt;
    private LocalDateTime archivedAt;
    private Long primaryInspectorId;
    private String primaryInspectorName;

    // ── Synthese ──
    private String summaryReport;

    // ── KPI calcules ──
    private int totalCheckpoints;
    private int findingsRecorded;
    private int nonConformCount;
    private int watchCount;
    private int criticalNonConformCount;

    // ── Listes imbriquees ──
    private List<FindingDTO> findings = new ArrayList<>();
    private List<ApprovalDTO> approvals = new ArrayList<>();
}
