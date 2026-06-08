package com.minexpert.hns.blast.dto;

import java.time.LocalDateTime;

import com.minexpert.hns.blast.enums.BlastStatus;
import com.minexpert.hns.blast.enums.BlastType;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Projection legere pour le registre des tirs (page de liste).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BlastListItemDTO {

    private Long id;
    private String reference;
    private LocalDateTime scheduledAt;
    private String timezone;
    private BlastType type;
    private BlastStatus status;
    private String pit;
    private String bench;
    private Long blasterId;
    private Long hseLeadId;
    private Long mineId;
}
