package com.minexpert.hns.dto.audit;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * LOT 52 — Paramètres optionnels d'escalade d'un constat d'audit vers une
 * non-conformité centrale. Les FK obligatoires de NonConformity (processus,
 * lieu, catégorie) peuvent être fournies ; sinon le premier paramètre
 * disponible de chaque table est utilisé par défaut.
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
public class EscalateObservationRequest {
    private Long workProcessId;
    private Long locationId;
    private Long categoryId;
}
