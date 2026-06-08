package com.minexpert.hns.blast.dto;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO de lecture d'un rapport d'evacuation (P6).
 *
 * <p>Reproduit fidelement {@link com.minexpert.hns.blast.entity.BlastEvacuationReport}
 * et expose en plus quelques champs derives utiles a l'UI :
 * <ul>
 *   <li>{@code signed} : pratique pour cacher les boutons "Ajouter incident" /
 *       "Signer" cote frontend sans avoir a comparer {@code signedAt} a null ;</li>
 *   <li>{@code reference} et {@code blastScheduledAt} : evite un appel a
 *       {@code GET /detail/{id}} suplementaire pour afficher l'en-tete du
 *       rapport.</li>
 * </ul>
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BlastEvacuationReportDTO {

    private Long id;
    private Long blastId;
    private String blastReference;
    private LocalDateTime blastScheduledAt;
    private String blastTimezone;
    private String alarmZoneScope;
    private String assemblyPoints;

    private LocalDateTime alarmTriggeredAt;
    private Integer musteredCount;
    private Integer missingCount;
    private Integer evacDurationSeconds;
    private LocalDateTime firedAt;
    private LocalDateTime allClearAt;
    private String incidents;
    private Long signedOffBy;
    private LocalDateTime signedAt;

    /** Derive : {@code true} des que {@code signedAt} est renseigne. */
    private boolean signed;
}
