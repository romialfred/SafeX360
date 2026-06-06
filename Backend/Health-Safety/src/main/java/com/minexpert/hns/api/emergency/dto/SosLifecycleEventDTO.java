package com.minexpert.hns.api.emergency.dto;

import java.time.LocalDateTime;

import com.minexpert.hns.api.emergency.enums.SosStatus;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class SosLifecycleEventDTO {
    private Long id;
    private Long sosAlertId;
    private SosStatus statusTo;
    private SosStatus statusFrom;
    private Long actorId;
    private String actorName;
    private String note;
    private LocalDateTime createdAt;
}
