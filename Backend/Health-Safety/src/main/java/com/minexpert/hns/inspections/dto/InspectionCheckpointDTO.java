package com.minexpert.hns.inspections.dto;

import com.minexpert.hns.enums.CheckpointResponseType;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Payload pour un point de controle (a saisir avec son template parent).
 *
 * <p>Validation metier (effectuee cote service) :</p>
 * <ul>
 *   <li>Si {@code responseType == NUMERIC_RANGE} : {@code minValue} ET
 *       {@code maxValue} doivent etre renseignes et {@code minValue <=
 *       maxValue}.</li>
 *   <li>Si {@code responseType == BOOLEAN} : {@code expectedValue} doit
 *       valoir "true" ou "false".</li>
 *   <li>Si {@code responseType == VISUAL_GRADE} : {@code expectedValue} doit
 *       valoir "GOOD" ou "WATCH" (seuil de conformite).</li>
 * </ul>
 */
@Data
@NoArgsConstructor
public class InspectionCheckpointDTO {

    private Long id;

    @NotBlank(message = "Le libelle du point de controle est obligatoire")
    @Size(max = 160)
    private String label;

    @Size(max = 500)
    private String helpText;

    @NotNull(message = "Le type de reponse est obligatoire")
    private CheckpointResponseType responseType;

    /** Borne min (uniquement NUMERIC_RANGE). */
    private Double minValue;

    /** Borne max (uniquement NUMERIC_RANGE). */
    private Double maxValue;

    @Size(max = 16)
    private String unit;

    @Size(max = 24)
    private String expectedValue;

    /**
     * Ordre d'affichage. Si null, le service auto-incremente sur la
     * position dans la liste {@code checkpoints} du template parent.
     */
    private Integer displayOrder;

    private Boolean critical = Boolean.FALSE;

    private Boolean required = Boolean.TRUE;
}
