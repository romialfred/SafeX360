package com.minexpert.hns.api.emergency.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO Point de rassemblement (LOT 48 Phase 2).
 */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class AssemblyPointDTO {
    private Long id;

    private String name;
    private String description;
    private String locationText;
    private Double latitude;
    private Double longitude;

    private Long managerId;
    private Long deputyManagerId;
    private Long cameraId;

    /** 1 (haute) → 5 (basse). */
    private Integer evacuationPriority;

    private Integer maxCapacity;
    private String status;
    private Long companyId;

    /** CSV des departmentIds couverts (Phase 2 — léger). */
    private String departmentIdsCsv;
}
