package com.minexpert.hns.dto;

import java.util.List;

import jakarta.validation.Valid;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class InvestActionDTO {
    // @Valid propage la validation à l'enquête (incidentId obligatoire). Volontairement
    // ABSENT sur correctiveActions : le wizard d'enquête autorise DÉLIBÉRÉMENT des
    // actions incomplètes, complétées plus tard (cf. SPEC anti-friction §10.2 — seule
    // l'étape 1 est obligatoire). Y forcer la validation serait une régression.
    @Valid
    private InvestigationDTO investigation;
    private List<CorrectiveActionDTO> correctiveActions;
}
