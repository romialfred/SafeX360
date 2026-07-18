package com.minexpert.hns.repository.projection;

/**
 * Projection générique (libellé, effectif) pour les agrégations GROUP BY du
 * tableau de bord.
 *
 * <p>L'alias SQL est {@code total} et non {@code count} : {@code COUNT} est un
 * mot réservé sur MySQL et l'utiliser comme alias de colonne dans une requête
 * native est source d'erreurs de parsing selon le mode SQL du serveur.</p>
 */
public interface LabelCount {
    String getLabel();

    Long getTotal();
}
