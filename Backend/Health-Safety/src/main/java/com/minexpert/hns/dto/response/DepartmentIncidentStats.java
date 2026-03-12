package com.minexpert.hns.dto.response;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class DepartmentIncidentStats {
    private Long departmentId;
    private LocalDateTime windowStart;
    private LocalDateTime windowEnd;
    private long incidentReportsLast30Days;
    private long completedInvestigationsLast30Days;
    private long correctiveActionsDueLast30Days;
}
