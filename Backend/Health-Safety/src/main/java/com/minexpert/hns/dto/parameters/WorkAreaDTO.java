package com.minexpert.hns.dto.parameters;

import java.time.LocalDateTime;

import com.minexpert.hns.entity.parameters.WorkArea;
import com.minexpert.hns.enums.Status;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class WorkAreaDTO {
    private Long id;
    private String name;
    private Long departmentId;
    private Long companyId;
    private String departmentName;
    private Status status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public WorkArea toEntity() {
        return new WorkArea(id, name, departmentId, companyId, status, createdAt, updatedAt);
    }
}
