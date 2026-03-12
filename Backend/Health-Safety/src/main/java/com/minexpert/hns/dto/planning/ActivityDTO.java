package com.minexpert.hns.dto.planning;

import java.time.LocalDate;
import java.time.LocalDateTime;

import com.minexpert.hns.enums.ActivityCategory;
import com.minexpert.hns.entity.planning.Activity;
import com.minexpert.hns.entity.planning.ActivityStatus;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ActivityDTO {
    private Long id;
    private String title;
    private LocalDate month;
    private LocalDateTime dateTime;
    private Long responsibleId;
    private ActivityCategory category;
    private ActivityStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public Activity toEntity() {
        return new Activity(id, title, month, dateTime, responsibleId, category, status, createdAt, updatedAt);
    }
}
