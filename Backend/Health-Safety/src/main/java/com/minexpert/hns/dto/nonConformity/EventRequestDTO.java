package com.minexpert.hns.dto.nonConformity;

import java.util.List;

import com.minexpert.hns.dto.CorrectiveActionDTO;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class EventRequestDTO {
    private EventAnalysisDTO analysis;
    private NonConformityDTO nonConformity;
    private List<CorrectiveActionDTO> correctiveActions;
    private Long companyId;
}
