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
        return new GeneralInspection(this.id, this.activityId != null ? new Activity(activityId) : null,
                this.siteId != null ? new Location(this.siteId) : null, this.plannedDate,
                this.startTime, this.endTime, this.description, this.objectives,
                riskTypes.toString(), ppe.toString(), StringListConverter.convertParticipantsToString(participants),
                status, createdAt, updatedAt);
    }

}
