package com.minexpert.hns.dto.error;

import java.time.LocalDateTime;

import com.minexpert.hns.entity.error.CausalAnalysis;
import com.minexpert.hns.enums.CausalMethod;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class CausalAnalysisDTO {
    private Long id;
    private Long errorEventId;
    /** Rattachement incident (module Investigation) — exclusif de errorEventId. */
    private Long incidentId;
    private CausalMethod method;
    private String summary;
    private Long conductedBy;
    private LocalDateTime conductedAt;

    public static CausalAnalysisDTO fromEntity(CausalAnalysis a) {
        return new CausalAnalysisDTO(a.getId(), a.getErrorEventId(), a.getIncidentId(), a.getMethod(), a.getSummary(),
                a.getConductedBy(), a.getConductedAt());
    }
}
