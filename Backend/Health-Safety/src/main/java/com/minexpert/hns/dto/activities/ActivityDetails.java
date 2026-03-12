package com.minexpert.hns.dto.activities;

import java.time.LocalDate;
import java.time.LocalTime;

import com.minexpert.hns.enums.ActivityStatus;
import com.minexpert.hns.enums.ActivityType;
import com.minexpert.hns.utility.StringListConverter;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ActivityDetails {
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
    private String ppe;
    private String participants;
    private ActivityStatus status;

    public HsActivityDetails toDetails() {
        return new HsActivityDetails(id, title, activityId, type,
                location, locationId, plannedDate, startTime, endTime, objectives, agenda,
                expectedResults, StringListConverter.convertToStringList(ppe), null, status);
    }

}
