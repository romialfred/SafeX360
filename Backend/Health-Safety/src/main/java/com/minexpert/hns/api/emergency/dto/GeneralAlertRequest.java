package com.minexpert.hns.api.emergency.dto;

import java.util.List;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class GeneralAlertRequest {
    @NotNull(message = "companyId is required")
    private Long companyId;
    @NotNull(message = "reasonCode is required")
    @Size(max = 100, message = "reasonCode must not exceed 100 characters")
    private String reasonCode;
    @Size(max = 2000, message = "message must not exceed 2000 characters")
    private String message;
    private Boolean drillMode;

    /** Périmètre de zones : "ALL" (défaut, mine entière) ou "SELECTION". */
    private String zoneScope;
    /** Zones ciblées (ids de Location) quand zoneScope = "SELECTION". */
    private List<Long> zoneIds;
}
