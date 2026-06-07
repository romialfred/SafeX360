package com.minexpert.hns.dosimetry.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * DTO de MedicalSurveillance.
 *
 * <p>CONFIDENTIEL : le champ restrictedClinicalDetails contient des donnees cliniques
 * sensibles. Il ne doit etre serialise dans une reponse API que pour le role MEDECIN
 * (cf. controller @PreAuthorize). Pour les autres roles, ce champ doit etre purge avant
 * exposition.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class MedicalSurveillanceDTO {

    private Long id;

    @NotNull
    private Long workerId;

    @NotBlank
    private String type;

    @NotBlank
    private String fitness;

    @NotNull
    private LocalDate examDate;

    private LocalDate nextDueDate;

    private String restrictedClinicalDetails;

    @NotNull
    private Long doctorId;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Long createdBy;
    private Long updatedBy;
}
