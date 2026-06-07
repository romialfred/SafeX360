package com.minexpert.hns.dosimetry.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Point d'une serie temporelle KPI (Phase 8).
 *
 * <p>Le couple {@code (period, value)} represente la valeur de la metrique demandee a la fin
 * du mois. La metrique elle-meme est portee dans {@link #metric} (libelle dynamique selon
 * la requete : "avgAnnualDose", "maxAnnualDose", "activeAlertsCount", etc.).
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DosimetryTrendPointDTO {

    /** Format "YYYY-MM" (mensuel). */
    private String period;

    /** Derniere date du mois disponible (date du snapshot retenue). */
    private LocalDate snapshotDate;

    /** Nom de la metrique servie (ex. "avgAnnualDose"). */
    private String metric;

    /** Valeur agreget. Peut etre null s'il n'existe pas de snapshot pour la periode. */
    private BigDecimal value;
}
