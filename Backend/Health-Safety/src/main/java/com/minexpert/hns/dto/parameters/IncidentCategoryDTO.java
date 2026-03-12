package com.minexpert.hns.dto.parameters;

import java.time.LocalDateTime;

import com.minexpert.hns.entity.parameters.IncidentCategory;
import com.minexpert.hns.enums.Status;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class IncidentCategoryDTO {
    private Long id;
    private String name;
    private Status status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public IncidentCategory toEntity() {
        return new IncidentCategory(this.id, this.name, this.status, this.createdAt, this.updatedAt);
    }
}
