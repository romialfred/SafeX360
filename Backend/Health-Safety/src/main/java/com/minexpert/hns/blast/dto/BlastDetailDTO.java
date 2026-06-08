package com.minexpert.hns.blast.dto;

import java.time.LocalDateTime;
import java.util.List;

import com.minexpert.hns.blast.enums.BlastStatus;
import com.minexpert.hns.blast.enums.BlastType;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Vue detaillee d'un tir : tous les champs metier + plan + gardes + destinataires.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BlastDetailDTO {

    private Long id;
    private String reference;
    private LocalDateTime scheduledAt;
    private String timezone;
    private BlastType type;
    private String pit;
    private String bench;
    private String block;
    private Double lat;
    private Double lng;
    private BlastStatus status;
    private Double exclusionRadiusM;
    private Long blasterId;
    private Long hseLeadId;
    private String alarmZoneScope;
    private Long mineId;
    private LocalDateTime misfireResolvedAt;
    private int version;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Long createdBy;
    private Long updatedBy;

    private BlastPlanDTO plan;
    private List<BlastGuardDTO> guards;
    private List<BlastRecipientDTO> recipients;
}
