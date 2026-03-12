package com.minexpert.hns.entity.activities;

import java.time.LocalDateTime;

import com.minexpert.hns.dto.activities.ActivityReportDTO;
import com.minexpert.hns.enums.ActivityReportStatus;
import com.minexpert.hns.utility.StringListConverter;

import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Entity
public class ActivityReport {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String summary;
    private String findings;
    private String docs;
    private String signOff;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "activity_id", nullable = false)
    private HsActivity activity;
    private ActivityReportStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public ActivityReportDTO toDTO() {
        return new ActivityReportDTO(id, summary, findings, null, StringListConverter.convertToLongList(signOff),
                activity != null ? activity.getId() : null, status, createdAt, updatedAt);
    }

}
