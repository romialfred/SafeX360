package com.minexpert.hns.dto.error;

import java.time.LocalDateTime;

import com.minexpert.hns.entity.error.JustCultureAssessment;
import com.minexpert.hns.enums.JustCultureOutcome;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class JustCultureAssessmentDTO {
    private Long id;
    private Long errorEventId;
    private JustCultureOutcome outcome;
    private String substitutionTest;
    private String decisionNotes;
    private Long assessedBy;
    private LocalDateTime assessedAt;

    public static JustCultureAssessmentDTO fromEntity(JustCultureAssessment j) {
        return new JustCultureAssessmentDTO(j.getId(), j.getErrorEventId(), j.getOutcome(),
                j.getSubstitutionTest(), j.getDecisionNotes(), j.getAssessedBy(), j.getAssessedAt());
    }
}
