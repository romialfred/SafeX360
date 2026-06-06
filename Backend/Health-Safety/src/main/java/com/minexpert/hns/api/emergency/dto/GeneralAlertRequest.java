package com.minexpert.hns.api.emergency.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Payload de déclenchement / clôture d'Alerte Générale (LOT 48 Phase 4).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class GeneralAlertRequest {
    private Long companyId;
    private String reasonCode;
    private String message;
    private Boolean drillMode;
}
