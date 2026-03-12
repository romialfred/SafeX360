package com.minexpert.hns.dto.parameters;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor

public class SeverityRequest {
    private Integer level;
    private String name;
    private List<SeverityLevelDTO> catDesc;
}
