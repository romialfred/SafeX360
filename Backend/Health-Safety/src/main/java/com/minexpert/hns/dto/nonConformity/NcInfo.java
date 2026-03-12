package com.minexpert.hns.dto.nonConformity;

import java.time.LocalDate;

import com.minexpert.hns.enums.EventStatus;
import com.minexpert.hns.enums.EventType;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class NcInfo {
    private Long id;
    private EventType type;
    private String number;
    private String title;
    private LocalDate date;
    private Long reporterId;
    private String reporterName;
    private String severityLevel;
    private String priority;
    private LocalDate deadline;

    private EventStatus status;
}
