package com.minexpert.hns.dto.parameters;

import java.time.LocalDateTime;

import com.minexpert.hns.entity.parameters.IncidentCategory;
import com.minexpert.hns.entity.parameters.IncidentType;
import com.minexpert.hns.entity.parameters.SeverityLevel;
import com.minexpert.hns.enums.Status;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class IncidentTypeDTO {
    private Long id;
    private String name;
    private String description;
    private Status status;
    private Long incidentCategoryId;
    private Long severityLevelId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public IncidentType toEntity() {
        return new IncidentType(id, name, description, status, new IncidentCategory(incidentCategoryId),
                new SeverityLevel(severityLevelId), createdAt,
                updatedAt);
    }
}
