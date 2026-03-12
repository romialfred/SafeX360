package com.minexpert.hns.dto.parameters;

import java.time.LocalDateTime;
import java.util.List;

import com.minexpert.hns.entity.parameters.IncidentTeam;
import com.minexpert.hns.entity.parameters.TeamMember;
import com.minexpert.hns.enums.Role;
import com.minexpert.hns.enums.Status;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TeamMemberDTO {
    private Long id;
    private Long employeeId;
    private String employeeName;
    private Long teamId;
    private List<Long> notificationLevel;
    private Role role;
    private Status status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public TeamMember toEntity() {
        return new TeamMember(this.id, this.employeeId, this.teamId != null ? new IncidentTeam(this.teamId) : null,
                this.notificationLevel != null ? this.notificationLevel.toString() : null,
                this.role, this.status, this.createdAt, this.updatedAt);
    }
}
