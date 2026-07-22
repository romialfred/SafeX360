package com.minexpert.hns.repository.incident.projection;

import com.minexpert.hns.enums.ControlHierarchy;

/**
 * Agrégation « mesures par niveau de hiérarchie » (ISO 45001 §8.1.2) — indicateur
 * de maturité HSE : combien d'actions par niveau (élimination → EPI).
 */
public interface HierarchyCount {
    ControlHierarchy getHierarchy();

    Long getTotal();
}
