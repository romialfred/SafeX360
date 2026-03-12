package com.minexpert.hns.dto.compliance;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class PosRequirement {
    private Long positionId;
    private List<Long> requirementIds;

}
