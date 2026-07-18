package com.minexpert.hns.dto.dashboard;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Métrique DÉCLARÉE (saisie par l'utilisateur dans le module Indicateurs), par
 * opposition à une métrique CALCULÉE à partir des données transactionnelles.
 *
 * <p>POURQUOI cette distinction : certains indicateurs réglementaires — le
 * LTIFR au premier chef — se calculent sur un dénominateur d'heures travaillées
 * (LTIFR = accidents avec arrêt × 1 000 000 / heures travaillées). Ce
 * dénominateur N'EXISTE NULLE PART dans le backend HNS : aucune entité ne porte
 * d'heures travaillées, d'effectif exposé ni de pointage. Calculer un LTIFR
 * reviendrait donc à inventer le dénominateur, c'est-à-dire à produire un
 * chiffre faux avec l'apparence d'un chiffre mesuré — exactement ce que cet
 * écran doit cesser de faire (il remplace une maquette aux chiffres fictifs).</p>
 *
 * <p>On lit donc la valeur telle qu'elle a été DÉCLARÉE dans le plan
 * d'indicateur de l'année ({@code hs_indicator} code « LTIFR » →
 * {@code indicator_plan} → {@code indicator_plan_entry}), en marquant
 * explicitement {@code source = "DECLARED"} pour que l'IHM puisse le signaler.
 * Si aucun indicateur, aucun plan ou aucune valeur réelle n'existe, l'objet
 * entier vaut {@code null} et l'IHM affiche « — ».</p>
 *
 * <p>Ordre des champs : value, target, source, period (constructeur positionnel
 * Lombok — ne pas réordonner).</p>
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class DeclaredMetricDTO {
    /** Dernière valeur réelle saisie (jamais recalculée côté serveur). */
    private Double value;
    /** Cible de la même période, si elle a été saisie. */
    private Double target;
    /** Toujours "DECLARED" ici — trace l'origine non calculée de la valeur. */
    private String source;
    /** Libellé de la période porteuse de la valeur (ex. « Mars », « T2 »). */
    private String period;
}
