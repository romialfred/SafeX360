package com.hrms.dto.Timesheet;

import com.hrms.dto.EmployeeDTO;
import com.hrms.dto.Status;
import com.hrms.entity.Timesheet.TeamManager;
import com.hrms.enums.Role;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class TeamManagerDTO {
    private Long id;

    private TeamDTO team;
    private EmployeeDTO employee;
    private Role role;
    private Status status;

    public TeamManager toEntity() {
        return new TeamManager(this.id, this.team != null ? this.team.toEntity() : null,
                this.employee != null ? this.employee.toEntity() : null,
                this.role, this.status);
    }
}
