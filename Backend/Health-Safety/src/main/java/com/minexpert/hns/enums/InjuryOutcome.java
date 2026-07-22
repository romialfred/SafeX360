package com.minexpert.hns.enums;

/**
 * Issue normalisée d'un événement (taxonomie ILO / OSHA — ISO 45001 §9.1.1),
 * base des indicateurs de fréquence inter-mines (LTIFR / TRIFR / taux de gravité).
 *
 * <ul>
 *   <li>FATALITY : décès.</li>
 *   <li>LTI  : Lost Time Injury — accident avec arrêt (jours perdus &gt; 0).</li>
 *   <li>RWC  : Restricted Work Case — travail restreint / poste aménagé.</li>
 *   <li>MTC  : Medical Treatment Case — soins médicaux au-delà des premiers secours.</li>
 *   <li>FAC  : First Aid Case — premiers secours seulement.</li>
 *   <li>NEAR_MISS : presque-accident (aucune lésion).</li>
 * </ul>
 */
public enum InjuryOutcome {
    FATALITY,
    LTI,
    RWC,
    MTC,
    FAC,
    NEAR_MISS;

    /** Cas « enregistrable » OSHA (recordable) : entre dans le TRIFR. */
    public boolean isRecordable() {
        return this == FATALITY || this == LTI || this == RWC || this == MTC;
    }

    /** Cas « avec arrêt » : entre dans le LTIFR (LTI + décès). */
    public boolean isLostTime() {
        return this == FATALITY || this == LTI;
    }
}
