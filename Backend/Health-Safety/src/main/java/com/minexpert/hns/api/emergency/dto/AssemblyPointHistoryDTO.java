package com.minexpert.hns.api.emergency.dto;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class AssemblyPointHistoryDTO {
    private Long id;
    private Long assemblyPointId;
    private Long companyId;
    private String action;
    private Long actorId;
    private String snapshotJson;
    private String diffSummary;
    private LocalDateTime createdAt;
}
