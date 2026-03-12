package com.minexpert.hns.dto.activities;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

import com.minexpert.hns.dto.ParticipantDTO;
import com.minexpert.hns.entity.activities.HsActivity;
import com.minexpert.hns.entity.parameters.Location;
import com.minexpert.hns.entity.planning.Activity;
import com.minexpert.hns.enums.ActivityFrequency;
import com.minexpert.hns.enums.ActivityStatus;
import com.minexpert.hns.enums.ActivityType;
import com.minexpert.hns.utility.StringListConverter;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class HsActivityDTO {
    private Long id;
    private Long activityId;
    private ActivityType type;
    private Long locationId;
    private LocalDate plannedDate;
    private LocalTime startTime;
    private LocalTime endTime;
    private String objectives;
    private String agenda;
    private String expectedResults;
    private List<String> ppe;
    private List<ParticipantDTO> participants;
    private ActivityStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public HsActivity toEntity() {
        return new HsActivity(this.id, this.activityId != null ? new Activity(this.activityId) : null, this.type,
                this.locationId != null ? new Location(this.locationId) : null, this.plannedDate,
                this.startTime, this.endTime, this.objectives, this.agenda,
                this.expectedResults, ppe.toString(), StringListConverter.convertParticipantsToString(participants),
                status, createdAt, updatedAt);
    }
}
