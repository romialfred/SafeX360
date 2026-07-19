package com.minexpert.hns.dosimetry.dto;

import java.time.LocalDate;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** Retrait contrôlé sans destruction de l'historique d'applicabilité. */
@Getter
@Setter
@NoArgsConstructor
public class RegulatoryRuleRetirementRequest {
    @NotNull @Positive
    private Long actorId;
    @NotNull
    private LocalDate effectiveOn;
    @NotBlank @Size(max = 1024)
    private String reason;
}
