package com.minexpert.hns.dto.parameters;

import java.time.LocalDate;
import java.time.LocalDateTime;

import com.minexpert.hns.entity.parameters.InternalAuditor;
import com.minexpert.hns.enums.Status;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class InternalAuditorDTO {
    private Long id;
    private Long employeeId;
    private String role;
    private Status status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public InternalAuditor toEntity() {
        return new InternalAuditor(id, employeeId, role, status, createdAt, updatedAt);
    }
}
