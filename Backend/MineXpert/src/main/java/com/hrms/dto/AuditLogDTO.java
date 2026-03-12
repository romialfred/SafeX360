package com.hrms.dto;

import java.time.LocalDateTime;

import com.hrms.entity.AuditLog;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class AuditLogDTO {
    private Long id;
    private EmployeeDTO employee;
    private String login;
    private LocalDateTime timestamp;
    private String status;

    public AuditLog toEntity(){
        return new AuditLog(this.id, this.employee!=null?this.employee.toEntity():null, this.login, this.timestamp, this.status);
    }
}
