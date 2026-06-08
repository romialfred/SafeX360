package com.minexpert.hns.enums;

/**
 * Type d'objet inspecte. Conditionne le referentiel cible et la nature des
 * points de controle.
 *
 * <ul>
 *   <li>{@code EQUIPMENT}  — Camion, excavateur, foreuse, compresseur,
 *       convoyeur, etc. Points de controle : visuels + mesures techniques
 *       (pression, niveau d'huile, etat des pneus...).</li>
 *   <li>{@code LOCATION}   — Atelier maintenance, magasin explosifs, fosse,
 *       bureau. Points de controle : conformite reglementaire du site
 *       (signalisation, extincteurs, EPC, eclairage...).</li>
 *   <li>{@code PROCEDURE}  — Consignation LOTO, travail en hauteur, espace
 *       confine, points chauds. Points de controle : etapes a verifier
 *       (autorisation signee, sas verifie, surveillance assuree...).</li>
 * </ul>
 */
public enum InspectionTemplateType {
    EQUIPMENT,
    LOCATION,
    PROCEDURE
}
