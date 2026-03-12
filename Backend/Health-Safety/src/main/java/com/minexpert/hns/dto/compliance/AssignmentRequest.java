package com.minexpert.hns.dto.compliance;

import java.time.LocalDateTime;

import com.minexpert.hns.entity.compliance.PositionAssignment;
import com.minexpert.hns.entity.compliance.Requirement;
import com.minexpert.hns.enums.Status;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class AssignmentRequest {
    private Long positionId;
    private Long requirementId;

    public PositionAssignment toEntity() {
        return new PositionAssignment(null, positionId, new Requirement(requirementId), Status.ACTIVE,
                LocalDateTime.now(), LocalDateTime.now());
    }
}
