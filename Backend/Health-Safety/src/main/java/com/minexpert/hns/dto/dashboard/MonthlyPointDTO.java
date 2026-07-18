package com.minexpert.hns.dto.dashboard;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Point mensuel de la courbe de tendance (1 = janvier … 12 = décembre).
 *
 * <p>Les 12 mois sont TOUJOURS présents : les requêtes SQL ne renvoient que les
 * mois qui portent au moins une ligne, le service complète les mois vides à 0.
 * Ici 0 est un fait vérifié (« aucun événement ce mois-là ») et non un bouchon,
 * contrairement aux KPI dont la source n'existe pas et qui restent {@code null}.</p>
 *
 * <p>Ordre des champs : month, incidents, nearMiss — à conserver (constructeur
 * positionnel Lombok).</p>
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class MonthlyPointDTO {
    private Integer month;
    private Long incidents;
    private Long nearMiss;
}
