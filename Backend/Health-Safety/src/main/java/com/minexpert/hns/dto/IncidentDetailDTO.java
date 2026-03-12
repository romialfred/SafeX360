package com.minexpert.hns.dto;

import java.time.LocalDateTime;
import java.util.List;

import com.minexpert.hns.entity.incident.Incident;
import com.minexpert.hns.entity.incident.IncidentDetail;
import com.minexpert.hns.entity.parameters.IncidentCategory;
import com.minexpert.hns.entity.parameters.IncidentType;
import com.minexpert.hns.entity.parameters.SeverityLevel;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class IncidentDetailDTO {
    private Long id;
    private Long incidentCategoryId;
    private Long incidentTypeId;
    private Long severityLevelId;
    private Long incidentId;
    private List<Long> affectedBodyParts;
    private String environmentalImpact;
    private String containmentMeasures;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public IncidentDetail toEntity() {
        return new IncidentDetail(id, new IncidentCategory(this.incidentCategoryId), new IncidentType(incidentTypeId),
                new SeverityLevel(severityLevelId), incidentId != null ? new Incident(incidentId) : null,
                affectedBodyParts.toString(), environmentalImpact, containmentMeasures, createdAt, updatedAt);
    }
}
