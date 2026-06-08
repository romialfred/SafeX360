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

    /** Voies d'acces concernees (V015 — P2.1). */
    private String accessConcerned;

    /** Points de rassemblement (V015 — P2.1). */
    private String assemblyPoints;

    private BlastStatus status;
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

    private Long mineId;
    private LocalDateTime misfireResolvedAt;

    /**
     * Notes de resolution du dernier raté (V017 — P5). Visible cote frontend
     * pour traçabilite operationnelle : protocole de deminage / re-amorcage
     * applique avant la levee du verrou misfire.
     */
    private String misfireResolutionNotes;

    private int version;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Long createdBy;
    private Long updatedBy;

    private BlastPlanDTO plan;
    private List<BlastGuardDTO> guards;
    private List<BlastRecipientDTO> recipients;
}
