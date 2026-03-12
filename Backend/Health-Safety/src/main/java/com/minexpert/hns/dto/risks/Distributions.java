package com.minexpert.hns.dto.risks;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class Distributions {
    private Map<String, Long> byLevelKey;
    private Map<String, Long> byStatus;
    private List<DistributionItem> byDepartment;
    private List<DistributionItem> byHazardSource;
}

