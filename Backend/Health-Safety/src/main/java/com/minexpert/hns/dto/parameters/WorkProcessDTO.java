package com.minexpert.hns.dto.parameters;

import java.time.LocalDateTime;

import com.minexpert.hns.entity.parameters.WorkProcess;
import com.minexpert.hns.enums.Status;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class WorkProcessDTO {
    private Long id;
    private String name;
    private Long departmentId;
    private String departmentName;
    private Status status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public WorkProcess toEntity() {
        return new WorkProcess(id, name, departmentId, status, createdAt, updatedAt);
    }
}