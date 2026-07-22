package com.minexpert.hns.dto;

import java.time.LocalDateTime;

import com.minexpert.hns.entity.incident.WitnessStatement;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class WitnessStatementDTO {
    private Long id;
    private Long investigationId;
    private Long witnessEmployeeId;
    private String witnessName;
    private String witnessRole;
    private String statement;
    private LocalDateTime takenAt;
    private Long takenBy;
    /** Résolu best-effort côté service (nom HRMS du témoin), non persisté. */
    private String witnessEmployeeName;

    public static WitnessStatementDTO fromEntity(WitnessStatement w) {
        return new WitnessStatementDTO(w.getId(), w.getInvestigationId(), w.getWitnessEmployeeId(),
                w.getWitnessName(), w.getWitnessRole(), w.getStatement(), w.getTakenAt(), w.getTakenBy(), null);
    }
}
