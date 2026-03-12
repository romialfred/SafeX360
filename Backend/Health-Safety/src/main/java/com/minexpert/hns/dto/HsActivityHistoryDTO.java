package com.minexpert.hns.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;

import com.minexpert.hns.entity.activities.HsActivity;
import com.minexpert.hns.entity.activities.HsActivityHistory;
import com.minexpert.hns.enums.ActivityStatus;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class HsActivityHistoryDTO {
    private Long id;
    private Long ownerId;
    private LocalDate date;
    private ActivityStatus status;
    private String comment;
    private Long hsActivityId;
    private LocalDateTime createdAt;

    public HsActivityHistory toEntity() {
        return new HsActivityHistory(id, ownerId, date, status, comment,
                hsActivityId != null ? new HsActivity(hsActivityId) : null,
                createdAt);
    }
}
