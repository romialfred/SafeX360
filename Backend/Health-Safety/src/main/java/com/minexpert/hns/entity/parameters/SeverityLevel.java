package com.minexpert.hns.entity.parameters;

import java.time.LocalDateTime;

import com.minexpert.hns.dto.parameters.SeverityLevelDTO;
import com.minexpert.hns.enums.Status;
import com.minexpert.hns.utility.StringListConverter;

import jakarta.persistence.Entity;
import jakarta.persistence.Enumerated;
import jakarta.persistence.EnumType;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
public class SeverityLevel {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String name;
    private String description;
    private Integer level;
    private String examples;
    @Enumerated(EnumType.STRING)
    private Status status;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "incident_category_id", nullable = false)
    private IncidentCategory incidentCategory;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public SeverityLevelDTO toDTO() {
        return new SeverityLevelDTO(this.id, this.name, this.description, this.level,
                examples != null ? StringListConverter.convertToStringList(examples) : null, this.status,
                incidentCategory != null ? this.incidentCategory.getId() : null, this.createdAt, this.updatedAt);
    }

    public SeverityLevel(Long id) {
        this.id = id;
    }
}
