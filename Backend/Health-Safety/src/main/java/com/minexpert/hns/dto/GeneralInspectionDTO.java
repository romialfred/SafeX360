package com.minexpert.hns.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import com.minexpert.hns.entity.GeneralInspection;
import com.minexpert.hns.entity.parameters.Location;
import com.minexpert.hns.entity.planning.Activity;
import com.minexpert.hns.enums.InspectionStatus;
import com.minexpert.hns.utility.StringListConverter;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class GeneralInspectionDTO {
    private Long id;
    private String title;
    private Long activityId;
    private Long siteId;
    private LocalDate plannedDate;
    private LocalTime startTime;
    private LocalTime endTime;
    private String description;
    private String objectives;
    private List<String> riskTypes;
    private List<String> ppe;
    private List<ParticipantDTO> participants;
    private InspectionStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public GeneralInspection toEntity() {
        // Refonte 2026-06 : la nouvelle entite GeneralInspection a plus de
        // champs (template, dates workflow). On utilise les setters pour
        // rester resilient aux ajouts futurs et eviter de couler le contrat
        // a l'ordre exact du @AllArgsConstructor.
        GeneralInspection entity = new GeneralInspection();
        entity.setId(this.id);
        entity.setActivity(this.activityId != null ? new Activity(this.activityId) : null);
        entity.setSite(this.siteId != null ? new Location(this.siteId) : null);
        entity.setPlannedDate(this.plannedDate);
        entity.setStartTime(this.startTime);
        entity.setEndTime(this.endTime);
        entity.setDescription(this.description);
        entity.setObjectives(this.objectives);
        entity.setRiskTypes(riskTypes != null ? riskTypes.toString() : null);
        entity.setPpe(ppe != null ? ppe.toString() : null);
        entity.setParticipants(StringListConverter.convertParticipantsToString(participants));
        entity.setStatus(this.status);
        entity.setCreatedAt(this.createdAt);
        entity.setUpdatedAt(this.updatedAt);
        return entity;
    }

}
