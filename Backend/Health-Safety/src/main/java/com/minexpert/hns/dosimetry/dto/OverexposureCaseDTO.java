package com.minexpert.hns.dosimetry.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;

import com.minexpert.hns.dosimetry.enums.AlertLevel;
import com.minexpert.hns.dosimetry.enums.CaseStatus;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class OverexposureCaseDTO {

    private Long id;

    @NotNull
    private Long workerId;

    @NotNull
    private AlertLevel level;

    /** Lien vers l'alerte d'exposition source (optionnel : null si ouverture manuelle). */
    private Long alertId;

    private String cause;
    private String correctiveActions;
    private String medicalDecision;

    private boolean authorityDeclaration;
    private LocalDate authorityDeclarationDate;

    @NotNull
    private CaseStatus status;

    private LocalDateTime openedAt;
    private LocalDateTime closedAt;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Long createdBy;
    private Long updatedBy;
}
