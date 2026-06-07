package com.minexpert.hns.dosimetry.dto;

import com.minexpert.hns.dosimetry.enums.DoseSource;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Requete de correction (supersede) d'un DoseRecord existant.
 *
 * <p>Append-only : on ne mute jamais l'enregistrement d'origine. On cree une NOUVELLE version
 * avec les valeurs corrigees, puis on chaine l'ancien via supersededRecordId.
 *
 * <p>Le champ {@code reason} est obligatoire et trace dans le DosimetryAuditLog (details JSON).
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class DoseRecordSupersedeRequestDTO {

    /** Id du DoseRecord original a remplacer. */
    @NotNull
    private Long originalId;

    /** Motif de la correction (audit forensique). */
    @NotBlank
    private String reason;

    /**
     * Worker concerne. On le redemande car le SUPERSEDE doit produire une copie semantique
     * complete, mais on verifie qu'il correspond bien au worker du record original.
     */
    @NotNull
    private Long workerId;

    @NotBlank
    private String period;

    @DecimalMin("0.0")
    @Max(value = 2000L)
    private Double hp10;

    @DecimalMin("0.0")
    @Max(value = 2000L)
    private Double hp007;

    @DecimalMin("0.0")
    @Max(value = 2000L)
    private Double hp3;

    @NotNull
    private DoseSource source;

    private boolean belowDetection;
    private String attachmentUrls;
    private String notes;

    private Long actorId;
}
