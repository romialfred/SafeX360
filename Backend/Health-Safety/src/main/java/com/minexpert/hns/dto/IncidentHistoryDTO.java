package com.minexpert.hns.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;

import com.minexpert.hns.entity.incident.Incident;
import com.minexpert.hns.entity.incident.IncidentHistory;
import com.minexpert.hns.enums.IncidentStatus;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class IncidentHistoryDTO {
    private Long id;
    private Long ownerId;
    private LocalDate date;
    private IncidentStatus status;
    private String comment;
    private Long incidentId;
    private LocalDateTime createdAt;

    public IncidentHistory toEntity() {
        return new IncidentHistory(id, ownerId, date, status, comment,
                incidentId != null ? new Incident(incidentId) : null,
                createdAt);
    }
}
