package com.minexpert.hns.dto.dashboard;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Couple (libellé, effectif) pour les répartitions du tableau de bord HSE.
 *
 * <p>ATTENTION (piège Lombok @AllArgsConstructor positionnel) : l'ordre des
 * champs est {@code label} puis {@code count}. Tout nouveau champ doit être
 * ajouté EN DERNIER, sinon tous les appels positionnels existants se décalent
 * silencieusement.</p>
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class LabelCountDTO {
    private String label;
    private Long count;
}
