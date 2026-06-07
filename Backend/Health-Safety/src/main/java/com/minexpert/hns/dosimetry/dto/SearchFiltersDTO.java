package com.minexpert.hns.dosimetry.dto;

import com.minexpert.hns.dosimetry.enums.DoseCategory;
import com.minexpert.hns.dosimetry.enums.DoseSpecialStatus;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Filtres de recherche pour le Registre des travailleurs exposes.
 *
 * <p>Tous les champs sont optionnels : un filtre null signifie "pas de restriction sur ce
 * critere". mineId est obligatoire (porte par le header X-Company-Id cote controller ou par
 * le body si le caller veut surcharger).
 *
 * <p>exposureLevel attend une chaine parmi GREEN, YELLOW, ORANGE, RED (cf.
 * ExposedWorkerQueryService.calculateExposureLevel).
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class SearchFiltersDTO {

    private Long mineId;

    private DoseCategory category;

    private DoseSpecialStatus specialStatus;

    /** GREEN | YELLOW | ORANGE | RED. */
    private String exposureLevel;

    private Long departmentId;

    private Long postId;

    /** Recherche textuelle sur matricule ou nom complet (LIKE insensitive). */
    private String search;
}
