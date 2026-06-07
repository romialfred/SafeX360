package com.minexpert.hns.dosimetry.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;

import com.minexpert.hns.dosimetry.enums.MedicalVisitType;
import com.minexpert.hns.dosimetry.enums.VisitStatus;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * DTO COMPLET d'une {@link com.minexpert.hns.dosimetry.entity.MedicalVisit}.
 *
 * <p><b>CONFIDENTIEL :</b> contient {@code detailedReport} (compte-rendu medical chiffre
 * AES-256-GCM en BDD). Ne doit JAMAIS etre serialise vers un client autre que le role
 * {@code DOSIMETRY_MEDICAL}. Pour les autres roles, utiliser
 * {@link MedicalVisitSummaryDTO}.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MedicalVisitFullDTO {

    private Long id;

    @NotNull
    private Long workerId;

    @NotNull
    private Long mineId;

    @NotNull
    private MedicalVisitType visitType;

    @NotNull
    private LocalDate scheduledDate;

    private LocalDate performedDate;

    @NotNull
    private Long physicianId;

    private String physicianName;

    @NotNull
    private VisitStatus status;

    private String generalConclusion;

    /** CHIFFRE EN BDD - role MEDICAL uniquement. */
    private String detailedReport;

    private String cancellationReason;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Long createdBy;
    private Long updatedBy;
}
