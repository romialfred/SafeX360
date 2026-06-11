package com.minexpert.hns.dto.audit;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * LOT 52 — Requête de validation d'équipe d'audit (ISO 19011:2018 §5.4.4 / §7).
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
public class ValidateTeamRequest {
    private Long auditId;
    private List<Long> auditorEmployeeIds;
    private Long leadEmployeeId;
    private List<Long> auditedDepartmentIds;
    /** Optionnel : restreint la recherche des auditeurs internes à une société. */
    private Long companyId;
}
