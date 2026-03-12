package com.minexpert.hns.dto.risks;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class OverviewMetrics {
    private int total;
    private int open;
    private int inProgress;
    private int closed;
    private int overdue;
}

