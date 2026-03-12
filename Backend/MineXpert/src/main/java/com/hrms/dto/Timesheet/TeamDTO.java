package com.hrms.dto.Timesheet;

import java.time.LocalDate;
import java.util.Date;
import java.util.List;

import com.hrms.dto.CompanyDTO;
import com.hrms.dto.DepartmentDTO;
import com.hrms.entity.Timesheet.Team;
import com.hrms.enums.Day;
import com.hrms.enums.Rotations;
import com.hrms.enums.TeamStatus;
import com.hrms.enums.TeamType;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class TeamDTO {
    private Long id;
    private String name;
    private String shortName;
    private CompanyDTO company;
    private DepartmentDTO department;
    private Day weekStartDay;
    private LocalDate nextWeekStartDate;
    private Integer workingHours;
    private Integer maxWorkingHours;
    private String color;
    private TeamType type;
    private String description;
    private Rotations rotation;
    private Integer remainingWorkingDays;
    private Integer remainingRestDays;
    private List<TeamMemberDTO> teamMembers;
    private List<TeamManagerDTO> teamManagers;
    private TeamStatus status;

    public Team toEntity() {
        return new Team(this.id, this.name, this.shortName, this.company != null ? this.company.toEntity() : null,
                this.department != null ? this.department.toEntity() : null,
                this.weekStartDay, this.nextWeekStartDate,
                this.workingHours, this.maxWorkingHours, this.color, this.type, this.description, this.rotation,
                this.remainingWorkingDays, this.remainingRestDays,
                this.teamMembers != null ? this.teamMembers.stream().map(TeamMemberDTO::toEntity).toList() : null,
                this.teamManagers != null ? this.teamManagers.stream().map(TeamManagerDTO::toEntity).toList() : null,
                status);
    }
}
