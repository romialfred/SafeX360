package com.minexpert.hns.dto.response;

import java.time.LocalDate;
import java.time.LocalDateTime;

import com.minexpert.hns.enums.IncidentStatus;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class IncidentHistoryDetails {
    private Long id;
    private Long ownerId;
    private String ownerName;
    private LocalDate date;
    private IncidentStatus status;
    private String comment;
    private Long incidentId;
    private LocalDateTime createdAt;

}
