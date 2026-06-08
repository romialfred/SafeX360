package com.minexpert.hns.blast.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Payload de signature d'un rapport d'evacuation (P6).
 *
 * <p>{@code signatureDataBase64} : empreinte graphique optionnelle saisie par
 * le signataire (canvas HTML5). Stockee en texte brut "data URL" (PNG base64)
 * dans {@code incidents} a la fin de la signature ne serait pas approprie :
 * on conserve donc cette signature dans un champ dedie cote service via une
 * concatenation en bas du bloc {@code incidents} avec un marqueur explicite
 * {@code [SIG_DATA_URL]:...} (les triggers BDD verrouillent la colonne apres
 * signature). C'est volontairement minimal : la valeur juridique reste portee
 * par {@code signedOffBy + signedAt} qui sont les seuls champs reconnus en
 * audit reglementaire.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BlastEvacuationReportSignDTO {

    /**
     * Empreinte canvas du signataire en data URL (PNG base64). Optionnel ;
     * peut etre {@code null} si la signature graphique n'est pas exigee.
     */
    private String signatureDataBase64;
}
