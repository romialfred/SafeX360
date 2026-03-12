package com.minexpert.hns.dto.audit;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ExecuteRequest {
    private ReportDTO report;
    private List<ContributorDTO> contributors;
}
