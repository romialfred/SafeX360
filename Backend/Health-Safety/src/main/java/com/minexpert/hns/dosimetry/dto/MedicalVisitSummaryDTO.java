package com.minexpert.hns.dosimetry.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;

import com.minexpert.hns.dosimetry.enums.MedicalVisitType;
import com.minexpert.hns.dosimetry.enums.VisitStatus;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * DTO RESUME d'une {@link com.minexpert.hns.dosimetry.entity.MedicalVisit} - SANS donnees
 * cliniques.
 *
 * <p>Destine aux roles PCR_RPO, RH, Manager HSE, ainsi qu'au travailleur lui-meme (pour son
 * propre dossier). Expose les metadonnees de pilotage (planification, statut, conclusion
 * generique) mais OMET volontairement {@code detailedReport}.
 *
 * <p>Cette separation garantit qu'aucune fuite de donnee clinique n'est possible : le DTO
 * ne porte pas le champ confidentiel, ce qui rend la fuite impossible meme en cas de bug
 * de mapping.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MedicalVisitSummaryDTO {

    private Long id;
    private Long workerId;
    private Long mineId;
    private MedicalVisitType visitType;
    private LocalDate scheduledDate;
    private LocalDate performedDate;
    private Long physicianId;
    private String physicianName;
    private VisitStatus status;

    /** Libelle generique non clinique (ex. "Visite realisee"). */
    private String generalConclusion;

    private String cancellationReason;
    private LocalDateTime createdAt;
}
