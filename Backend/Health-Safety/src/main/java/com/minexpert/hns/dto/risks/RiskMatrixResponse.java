package com.minexpert.hns.dto.risks;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RiskMatrixResponse {
    private int[][] counts;
    private List<String> probabilityLabels;
    private List<String> severityLabels;
}

