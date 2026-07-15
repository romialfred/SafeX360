package com.minexpert.hns.blast.dto;

import java.time.LocalDateTime;
import java.util.List;

import com.minexpert.hns.blast.enums.BlastType;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Payload de creation d'un tir. Le statut initial est toujours {@code DRAFT}.
 * La reference est generee cote serveur si absente.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BlastCreateDTO {

    @Size(max = 64)
    private String reference;

    @NotNull
    private LocalDateTime scheduledAt;

    @Size(max = 64)
    private String timezone;

    @NotNull
    private BlastType type;

    private String pit;
    private String bench;
    private String block;
    private Double lat;
    private Double lng;

    /** Voies d'acces concernees / signalisation (V015 — P2.1). */
    private String accessConcerned;

    /** Points de rassemblement (CSV libre, V015 — P2.1). */
    private String assemblyPoints;

    private Double exclusionRadiusM;
    private Long blasterId;

    /** Composition de l'equipe de tir (V015 — P2.1). */
    private String team;

    private Long hseLeadId;

    /** Limite PPV reglementaire (mm/s) (V015 — P2.1). */
    private Double ppvLimit;

    /** Recepteurs sensibles a proximite (V015 — P2.1). */
    private String sensitiveReceivers;

    private String alarmZoneScope;

    /** Notes sur les pieces jointes (V015 — P2.1). */
    private String attachmentsNote;

    /** Notes libres de fin de fiche (V015 — P2.1). */
    private String notes;

    @NotNull
    private Long mineId;

    /** Cloisonnement par mine (injecte par le controller depuis le param valide). */
    private Long companyId;

    private BlastPlanDTO plan;
    private List<BlastGuardDTO> guards;
    private List<BlastRecipientDTO> recipients;
}
