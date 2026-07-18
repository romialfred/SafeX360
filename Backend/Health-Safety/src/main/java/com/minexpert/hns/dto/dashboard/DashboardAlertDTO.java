package com.minexpert.hns.dto.dashboard;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Alerte affichée sur le tableau de bord HSE.
 *
 * <p>Règle d'honnêteté : une alerte n'est produite QUE si un décompte réel,
 * scopé mine, est strictement positif. Aucune alerte « décorative » n'est
 * générée. Les alertes que le modèle de données ne permet pas de calculer (ex.
 * « habilitations expirées » : il n'existe aucune entité d'habilitation
 * transverse dans HNS) sont simplement absentes de la liste.</p>
 *
 * <p>Ordre des champs : priority, title, value, description (constructeur
 * positionnel Lombok — ne pas réordonner).</p>
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class DashboardAlertDTO {
    /** "high" | "medium" | "low". */
    private String priority;
    private String title;
    /** Valeur brute mise en avant par l'IHM (déjà formatée en chaîne). */
    private String value;
    private String description;
}
