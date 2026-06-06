package com.minexpert.hns.api.emergency.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class RescueTeamDTO {
    private Long id;
    private String name;
    private String description;
    private Long companyId;
    private String status;
    private Integer memberCount;
    private Integer shiftCount;
}
