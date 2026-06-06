package com.minexpert.hns.api.emergency.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class RescueTeamMemberDTO {
    private Long id;
    private Long teamId;
    private Long employeeId;
    private String role;
    private Boolean isTeamLeader;
}
