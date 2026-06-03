package com.minexpert.hns.dto.parameters;

import java.time.LocalDateTime;

import com.minexpert.hns.entity.parameters.CheckList;
import com.minexpert.hns.entity.parameters.IncidentCategory;
import com.minexpert.hns.enums.Status;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class CheckListDTO {
    private Long id;
    private String name;
    private String description;
    private Status status;
    private Long incidentCategoryId;
    private Long companyId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public CheckList toEntity() {
        return new CheckList(id, name, description, status, new IncidentCategory(incidentCategoryId), companyId,
                createdAt,
                updatedAt);
    }
}
