package com.minexpert.hns.inspections.dto;

import java.time.LocalDateTime;

import com.minexpert.hns.enums.FindingConformity;

import jakarta.validation.constraints.Size;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Constat saisi sur le terrain par l'inspecteur.
 *
 * <p>Reception aussi bien en lecture (renvoi liste depuis l'API) qu'en
 * ecriture (batch upsert via {@code POST /inspection/{id}/findings/batch}).
 * Le champ {@code id} est null pour une creation, renseigne pour une mise
 * a jour.</p>
 */
@Data
@NoArgsConstructor
public class FindingDTO {

    /** ID du finding existant (update). Null pour creation. */
    private Long id;

    /** ID du checkpoint reference (obligatoire pour creation). */
    private Long checkpointId;

    /**
     * Reponse brute serialisee selon le type de checkpoint.
     * Cf. {@code InspectionFinding.rawValue} pour le format detaille.
     */
    @Size(max = 2000)
    private String rawValue;

    /**
     * Conformite calculee ou surchargee. Si null, le service calcule auto
     * depuis le rawValue et le checkpoint.
     */
    private FindingConformity conformity;

    @Size(max = 1000)
    private String note;

    /** IDs media (photos) separes par virgules. */
    @Size(max = 500)
    private String photoIds;

    /** Auteur (rempli par le service depuis X-User-Id si null). */
    private Long recordedBy;

    private LocalDateTime recordedAt;

    /** Si surcharge de la conformite, justification. */
    @Size(max = 500)
    private String overrideReason;

    // ── Champs en lecture seule (renseignes par le service) ──
    /** Libelle du checkpoint (denormalisation pour affichage). */
    private String checkpointLabel;

    /** Type de reponse attendue (pour rendu cote front). */
    private String responseType;

    /** Borne min (NUMERIC_RANGE). */
    private Double minValue;

    /** Borne max (NUMERIC_RANGE). */
    private Double maxValue;

    /** Unite (NUMERIC_RANGE). */
    private String unit;

    /** Marqueur critique. */
    private Boolean critical;

    /** Texte d'aide a l'inspecteur. */
    private String helpText;

    /** Ordre d'affichage (provient du checkpoint). */
    private Integer displayOrder;
}
