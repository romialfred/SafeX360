package com.minexpert.hns.entity.parameters;

import java.time.LocalDateTime;

import com.minexpert.hns.dto.parameters.IncidentTypeDTO;
import com.minexpert.hns.enums.Status;

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
public class IncidentType {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String name;
    private String description;
    private Long companyId;
    private Status status;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "incident_category_id", nullable = false)
    private IncidentCategory incidentCategory;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "severity_level_id", nullable = false)
    private SeverityLevel severityLevel;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public IncidentType(Long id) {
        this.id = id;
    }

    public IncidentTypeDTO toDTO() {
        return new IncidentTypeDTO(this.id, this.name, this.description, this.companyId, this.status,
                incidentCategory != null ? this.incidentCategory.getId() : null,
                severityLevel != null ? this.severityLevel.getId() : null,
                this.createdAt, this.updatedAt);
    }
}
