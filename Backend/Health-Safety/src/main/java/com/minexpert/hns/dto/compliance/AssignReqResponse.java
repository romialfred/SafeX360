package com.minexpert.hns.dto.compliance;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class AssignReqResponse {
    private String position;
    private Long positionId;
    private List<AssignRequirement> requirements;

}
