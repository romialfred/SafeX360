package com.minexpert.hns.blast.dto;

import java.time.LocalDateTime;
import java.util.List;

import com.minexpert.hns.blast.enums.BlastStatus;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Filtres de recherche du registre des tirs.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BlastSearchFiltersDTO {

    private Long mineId;
    /** Cloisonnement par mine (injecte/valide par le CompanyScopeFilter ; prime sur mineId). */
    private Long companyId;
    private List<BlastStatus> statuses;
    private LocalDateTime from;
    private LocalDateTime to;
    private String pit;
    private Long blasterId;
}
