package com.minexpert.hns.dosimetry.dto;

import java.util.List;

import com.minexpert.hns.dosimetry.enums.KpiCategory;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Histogramme de la distribution des doses annuelles par rapport a la limite reglementaire
 * du couple {@code (categorie, grandeur)} :
 *
 * <ul>
 *   <li>{@code [0% .. 25%]}</li>
 *   <li>{@code ]25% .. 50%]}</li>
 *   <li>{@code ]50% .. 75%]}</li>
 *   <li>{@code ]75% .. 90%]}</li>
 *   <li>{@code ]90% .. 100%]}</li>
 *   <li>{@code ]100% .. +inf[} (surexposition)</li>
 * </ul>
 *
 * <p>La somme {@code buckets[*].count} totalise {@link #workersCount}. La limite utilisee
 * est rappelee dans {@link #regulatoryLimit} (mSv).
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DosimetryDistributionDTO {

    private Long mineId;
    private int year;
    private KpiCategory category;
    private Double regulatoryLimit;
    /** True uniquement si une limite active mine/globale a ete resolue. */
    private boolean regulatoryLimitConfigured;
    /** CONFIGURED, CATEGORY_REQUIRED ou NOT_CONFIGURED_LOCAL_VALIDATION_REQUIRED. */
    private String regulatoryLimitStatus;
    private long workersCount;
    private List<Bucket> buckets;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Bucket {
        /** Borne inferieure (% inclus). */
        private double fromPct;
        /** Borne superieure (% exclus pour les buckets internes ; +inf pour le dernier). */
        private double toPct;
        /** Libelle court ex. "0-25%". */
        private String label;
        /** Nombre de workers tombant dans le bucket. */
        private long count;
    }
}
