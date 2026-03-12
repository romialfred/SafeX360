package com.minexpert.hns.dto.risks;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DistributionItem {
    private String key;
    private String label;
    private long count;
}

