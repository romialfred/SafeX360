package com.hrms.dto.Timesheet;

import com.hrms.dto.EmployeeDTO;
import com.hrms.dto.Status;
import com.hrms.entity.Timesheet.TeamMember;
import com.hrms.enums.Shifts;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class TeamMemberDTO {
    private Long id;

    private TeamDTO team;

    private EmployeeDTO employee;
    private Shifts shift;
    private Status status;

    public TeamMember toEntity() {
        return new TeamMember(this.id, this.team != null ? this.team.toEntity() : null,
                this.employee != null ? this.employee.toEntity() : null, this.shift, this.status);
    }
}
