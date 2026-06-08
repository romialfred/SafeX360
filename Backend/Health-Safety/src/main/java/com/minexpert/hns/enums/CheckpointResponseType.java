package com.minexpert.hns.enums;

/**
 * Type de reponse attendue pour un point de controle d'inspection.
 *
 * <p>Determine le widget tactile affiche cote mobile/tablette :</p>
 * <ul>
 *   <li>{@code BOOLEAN}        — 2 tuiles (Conforme / Non conforme). Reponse :
 *       "true" / "false". Utilise pour les controles binaires (extincteur
 *       present oui/non, autorisation signee oui/non).</li>
 *   <li>{@code VISUAL_GRADE}   — 3 tuiles (Bon / A surveiller / Mauvais).
 *       Reponse : "GOOD" / "WATCH" / "POOR". Utilise pour les controles
 *       visuels gradues (etat general des pneus, etat du chassis...).</li>
 *   <li>{@code NUMERIC_RANGE}  — Saisie numerique avec min/max affiches.
 *       Reponse : valeur numerique en string. Auto-rouge si hors plage.
 *       Utilise pour pressions, niveaux, voltages...</li>
 *   <li>{@code PHOTO_REQUIRED} — Bouton "Prendre photo" (camera API). Reponse :
 *       liste d'IDs media. Utilise pour traces visuelles obligatoires.</li>
 *   <li>{@code FREE_TEXT}      — Champ texte libre (note). Utilise pour
 *       observations qualitatives.</li>
 * </ul>
 */
public enum CheckpointResponseType {
    BOOLEAN,
    VISUAL_GRADE,
    NUMERIC_RANGE,
    PHOTO_REQUIRED,
    FREE_TEXT
}
