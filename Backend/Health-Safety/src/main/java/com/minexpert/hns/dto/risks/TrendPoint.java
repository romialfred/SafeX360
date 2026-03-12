package com.minexpert.hns.dto.risks;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TrendPoint {
    private String month; // YYYY-MM
    private long total;
    private long open;   // not closed
    private long closed;
}

