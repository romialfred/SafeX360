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
    private List<BlastStatus> statuses;
    private LocalDateTime from;
    private LocalDateTime to;
    private String pit;
    private Long blasterId;
}
