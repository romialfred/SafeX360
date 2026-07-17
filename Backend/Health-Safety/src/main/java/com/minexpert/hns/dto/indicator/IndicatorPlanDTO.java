package com.minexpert.hns.dto.indicator;

import java.util.ArrayList;
import java.util.List;

import com.minexpert.hns.enums.IndicatorDirection;
import com.minexpert.hns.enums.IndicatorFrequency;

import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO d'un plan complet : en-tete + periodes. En lecture, il est enrichi des
 * meta de l'indicateur (nom, unite, frequence, direction) pour que l'IHM
 * affiche l'en-tete sans second appel. id == null => plan non encore persiste
 * (squelette genere a la volee selon la frequence).
 */
@Data
@NoArgsConstructor
public class IndicatorPlanDTO {
    private Long id;
    private Long indicatorId;
    private Integer year;
    private Long companyId;

    // Meta indicateur (lecture seule, pour l'en-tete IHM).
    private String indicatorCode;
    private String indicatorName;
    private String unit;
    private IndicatorFrequency frequency;
    private IndicatorDirection direction;
    private Boolean hasForecast;

    private List<IndicatorPlanEntryDTO> entries = new ArrayList<>();
}
