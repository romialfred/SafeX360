package com.minexpert.hns.dosimetry.enums;

/**
 * Classification reglementaire d'une zone de mesure (CIPR 103 / AIEA GSR Part 3).
 *
 * <ul>
 *   <li>{@link #SURVEILLED} : zone surveillee (potentiel d'exposition &gt; 1 mSv/an, &lt; 6 mSv/an).</li>
 *   <li>{@link #CONTROLLED} : zone controlee (potentiel &gt;= 6 mSv/an ou risque de contamination).</li>
 *   <li>{@link #NONE} : zone non classifiee (acces public ou potentiel &lt; 1 mSv/an).</li>
 * </ul>
 */
public enum ZoneClass {
    SURVEILLED,
    CONTROLLED,
    NONE
}
