package com.minexpert.hns.dosimetry.enums;

/**
 * Origine d'un enregistrement de dose.
 *  - AGENCY    : agence agreee (lecture officielle TLD/OSL/FILM)
 *  - EPD       : dosimetre electronique a lecture directe
 *  - ESTIMATED : dose reconstruite/estimee (calcul ou modele)
 */
public enum DoseSource {
    AGENCY,
    EPD,
    ESTIMATED
}
