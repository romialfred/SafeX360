package com.minexpert.hns.dto;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class InvestActionDTO {
    private InvestigationDTO investigation;
    private List<CorrectiveActionDTO> correctiveActions;
}
