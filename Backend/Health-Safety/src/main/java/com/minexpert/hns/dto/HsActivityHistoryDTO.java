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
    private Integer evaluation;
    private String closingReport;
    private Long hsActivityId;
    private LocalDateTime createdAt;

    /** Mapping par setters : robuste au changement d'arite (evite le piege @AllArgsConstructor). */
    public HsActivityHistory toEntity() {
        HsActivityHistory e = new HsActivityHistory();
        e.setId(id);
        e.setOwnerId(ownerId);
        e.setDate(date);
        e.setStatus(status);
        e.setComment(comment);
        e.setEvaluation(evaluation);
        e.setClosingReport(closingReport);
        e.setHsActivity(hsActivityId != null ? new HsActivity(hsActivityId) : null);
        e.setCreatedAt(createdAt);
        return e;
    }
}
