package com.minexpert.hns.dosimetry.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;

import com.minexpert.hns.dosimetry.enums.FitnessLevel;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * DTO COMPLET d'une {@link com.minexpert.hns.dosimetry.entity.FitnessAssessment}.
 *
 * <p><b>CONFIDENTIEL :</b> contient {@code restrictions} (details cliniques chiffres). Acces
 * strictement reserve au role {@code DOSIMETRY_MEDICAL}. Pour les autres roles, utiliser
 * {@link FitnessAssessmentPublicDTO}.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FitnessAssessmentFullDTO {

    private Long id;

    @NotNull
    private Long workerId;

    @NotNull
    private Long mineId;

    private Long medicalVisitId;

    @NotNull
    private LocalDate assessmentDate;

    private LocalDate validUntil;

    @NotNull
    private FitnessLevel fitness;

    /** CHIFFRE EN BDD - role MEDICAL uniquement. */
    private String restrictions;

    private String publicRestrictionsSummary;

    private LocalDate reviewRequiredDate;

    @NotNull
    private Long physicianId;

    private String physicianName;

    private boolean signed;
    private LocalDateTime signedAt;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Long createdBy;
    private Long updatedBy;
}
