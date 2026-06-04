package com.minexpert.hns.dto.parameters;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class TeamRequest {
    private Long id;
    private Long departmentId;
    private String name;
    private Long companyId;
    private List<TeamMemberDTO> members;
}
