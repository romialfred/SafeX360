package com.minexpert.hns.dto.parameters;

import java.time.LocalDateTime;
import java.util.List;

import com.minexpert.hns.entity.parameters.IncidentCategory;
import com.minexpert.hns.entity.parameters.SeverityLevel;
import com.minexpert.hns.enums.Status;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class SeverityLevelDTO {
    private Long id;
    private String name;
    private String description;
    private Integer level;
    private List<String> examples;
    private Status status;
    private Long incidentCategoryId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public SeverityLevel toEntity() {
        return new SeverityLevel(id, name, description, level, examples != null ? examples.toString() : null, status,
                new IncidentCategory(incidentCategoryId),
                createdAt,
                updatedAt);
    }
}
