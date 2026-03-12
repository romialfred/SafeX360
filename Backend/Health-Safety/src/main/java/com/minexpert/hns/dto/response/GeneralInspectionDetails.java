package com.minexpert.hns.dto.response;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

import com.minexpert.hns.enums.InspectionStatus;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class GeneralInspectionDetails {
    private Long id;
    private String title;
    private Long activityId;
    private String site;
    private Long locationId;
    private LocalDate plannedDate;
    private LocalTime startTime;
    private LocalTime endTime;
    private String description;
    private String objectives;
    private List<String> riskTypes;
    private List<String> ppe;
    private List<ParticipantResponse> participants;
    private InspectionStatus status;
}
