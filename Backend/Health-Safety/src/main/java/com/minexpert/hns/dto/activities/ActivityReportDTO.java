package com.minexpert.hns.dto.activities;

import java.time.LocalDateTime;
import java.util.List;

import com.minexpert.hns.dto.MediaDTO;
import com.minexpert.hns.entity.activities.ActivityReport;
import com.minexpert.hns.entity.activities.HsActivity;
import com.minexpert.hns.enums.ActivityReportStatus;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ActivityReportDTO {
    private Long id;
    private String summary;
    private String findings;
    private List<MediaDTO> docs;
    private List<Long> signOff;
    private Long activityId;

    private ActivityReportStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public ActivityReport toEntity() {
        return new ActivityReport(this.id, this.summary, this.findings, null, signOff.toString(),
                activityId != null ? new HsActivity(activityId) : null, status, this.createdAt,
                this.updatedAt);
    }
}
