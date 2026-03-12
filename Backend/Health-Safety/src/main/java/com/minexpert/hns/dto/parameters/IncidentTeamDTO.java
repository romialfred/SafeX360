package com.minexpert.hns.dto.parameters;

import java.time.LocalDateTime;
import com.minexpert.hns.entity.parameters.IncidentTeam;
import com.minexpert.hns.enums.Status;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class IncidentTeamDTO {
    private Long id;
    private Long departmentId;
    private String departmentName;
    private String name;
    private Status status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public IncidentTeam toEntity() {
        return new IncidentTeam(this.id, this.departmentId, this.name, status, this.createdAt, this.updatedAt);
    }
}
