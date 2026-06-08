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

    private Double exclusionRadiusM;
    private Long blasterId;
    private Long hseLeadId;
    private String alarmZoneScope;

    @NotNull
    private Long mineId;

    private BlastPlanDTO plan;
    private List<BlastGuardDTO> guards;
    private List<BlastRecipientDTO> recipients;
}
