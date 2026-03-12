package com.minexpert.hns.dto.risks;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RiskOverviewResponse {
    private OverviewMetrics metrics;
    private RiskMatrixResponse matrix;
    private Distributions distributions;
    private List<TrendPoint> monthly;
}

