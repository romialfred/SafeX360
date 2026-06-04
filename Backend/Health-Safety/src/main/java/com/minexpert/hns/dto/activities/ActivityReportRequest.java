package com.minexpert.hns.dto.activities;

import java.util.List;

import com.minexpert.hns.dto.CorrectiveActionDTO;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ActivityReportRequest {
    private ActivityReportDTO report;
    private List<CorrectiveActionDTO> actions;
    private Long companyId;
}
