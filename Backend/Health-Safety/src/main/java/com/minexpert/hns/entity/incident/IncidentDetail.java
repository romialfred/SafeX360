package com.minexpert.hns.entity.incident;

import java.time.LocalDateTime;

import com.minexpert.hns.dto.IncidentDetailDTO;
import com.minexpert.hns.entity.parameters.IncidentCategory;
import com.minexpert.hns.entity.parameters.IncidentType;
import com.minexpert.hns.entity.parameters.SeverityLevel;
import com.minexpert.hns.utility.StringListConverter;

import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
public class IncidentDetail {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "incident_category_id", nullable = false)
    private IncidentCategory incidentCategory;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "incident_type_id", nullable = false)
    private IncidentType incidentType;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "severity_level_id", nullable = false)
    private SeverityLevel severityLevel;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "incident_id", nullable = false)
    private Incident incident;

    private String affectedBodyParts;
    private String environmentalImpact;
    private String containmentMeasures;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public IncidentDetailDTO toDTO() {
        return new IncidentDetailDTO(this.id, this.incidentCategory != null ? this.incidentCategory.getId() : null,
                this.incidentType != null ? this.incidentType.getId() : null,
                this.severityLevel != null ? this.severityLevel.getId() : null,
                this.incident != null ? this.incident.getId() : null,
                StringListConverter.convertToLongList(this.affectedBodyParts),
                this.environmentalImpact, this.containmentMeasures, this.createdAt, this.updatedAt);
    }
}
