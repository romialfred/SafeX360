package com.minexpert.hns.repository.projection;

/**
 * Projection (identifiant, effectif) — utilisée pour la répartition par mine,
 * où le libellé lisible n'est pas connu de HNS (le référentiel des sociétés est
 * porté par le microservice MineXpert/HRMS). L'IHM résout l'id en nom.
 */
public interface IdCount {
    Long getId();

    Long getTotal();
}
