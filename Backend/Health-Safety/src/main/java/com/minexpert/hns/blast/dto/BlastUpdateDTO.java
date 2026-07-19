package com.minexpert.hns.blast.dto;

import java.time.LocalDateTime;
import java.util.List;

import com.minexpert.hns.blast.enums.BlastType;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Payload de mise a jour d'un tir. Autorise en statut {@code DRAFT} et
 * {@code PLANNED}. Une modification exceptionnelle d'un tir
 * {@code CONFIRMED} exige un {@code BLAST_ADMIN}, une raison et la version
 * lue par le client ; elle invalide la confirmation et remet le tir en
 * {@code PLANNED} pour une nouvelle validation.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BlastUpdateDTO {

    @NotNull
    private Long id;

    /** Version optimiste lue avec le détail du tir. */
    @NotNull
    private Integer version;

    private LocalDateTime scheduledAt;
    private String timezone;
    private BlastType type;
    private String pit;
    private String bench;
    private String block;
    private Double lat;
    private Double lng;

    /** Voies d'acces concernees (V015 — P2.1). */
    private String accessConcerned;

    /** Points de rassemblement (V015 — P2.1). */
    private String assemblyPoints;

    private Double exclusionRadiusM;
    private Long blasterId;

    /** Equipe de tir (V015 — P2.1). */
    private String team;

    private Long hseLeadId;

    /** Limite PPV (mm/s) (V015 — P2.1). */
    private Double ppvLimit;

    /** Recepteurs sensibles (V015 — P2.1). */
    private String sensitiveReceivers;

    private String alarmZoneScope;

    /** Notes sur les pieces jointes (V015 — P2.1). */
    private String attachmentsNote;

    /** Notes libres (V015 — P2.1). */
    private String notes;

    private BlastPlanDTO plan;
    private List<BlastGuardDTO> guards;
    private List<BlastRecipientDTO> recipients;

    /** Raison obligatoire si le tir est déjà confirmé. */
    private String reason;
}
