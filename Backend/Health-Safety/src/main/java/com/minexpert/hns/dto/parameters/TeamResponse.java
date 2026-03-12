package com.minexpert.hns.dto.parameters;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class TeamResponse {
    private Long id;
    private String teamName;
    private String departmentName;
    private List<TeamMemberDTO> members;
}
