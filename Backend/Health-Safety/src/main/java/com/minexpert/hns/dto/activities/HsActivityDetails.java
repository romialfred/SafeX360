package com.minexpert.hns.dto.activities;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

import com.minexpert.hns.dto.response.ParticipantResponse;
import com.minexpert.hns.enums.ActivityStatus;
import com.minexpert.hns.enums.ActivityType;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class HsActivityDetails {
    private Long id;
    private String title;
    private Long activityId;
    private ActivityType type;
    private String location;
    private Long locationId;
    private LocalDate plannedDate;
    private LocalTime startTime;
    private LocalTime endTime;
    private String objectives;
    private String agenda;
    private String expectedResults;
    private List<String> ppe;
    private List<ParticipantResponse> participants;
    private ActivityStatus status;
}
