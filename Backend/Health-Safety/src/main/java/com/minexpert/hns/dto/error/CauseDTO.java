package com.minexpert.hns.dto.error;

import com.minexpert.hns.entity.error.Cause;
import com.minexpert.hns.enums.CauseLevel;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class CauseDTO {
    private Long id;
    private Long causalAnalysisId;
    private String label;
    private CauseLevel level;
    private String category;
    private Long parentCauseId;

    public static CauseDTO fromEntity(Cause c) {
        return new CauseDTO(c.getId(), c.getCausalAnalysisId(), c.getLabel(), c.getLevel(),
                c.getCategory(), c.getParentCauseId());
    }
}
