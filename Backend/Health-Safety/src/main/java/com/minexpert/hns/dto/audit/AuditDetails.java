package com.minexpert.hns.dto.audit;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import com.minexpert.hns.enums.AuditCategory;
import com.minexpert.hns.enums.AuditStatus;
import com.minexpert.hns.enums.PlanningStatus;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class AuditDetails {
    private Long id;
    private String title;
    private String refNumber;
    private List<String> objectives;
    private List<Long> processes;
    private Long scopeId;
    private List<String> methods;
    private String description;
    private AuditCategory category;
    private Map<String, List<String>> auditTypes;
    private List<String> references;
    private LocalDate startDate;
    private LocalDate endDate;
    private AuditStatus status;
    private PlanningStatus planningStatus;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
