package com.minexpert.hns.dto.audit;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * LOT 52 — Résultat de l'escalade d'un constat d'audit en non-conformité
 * centrale. Idempotent : si le constat est déjà escaladé, renvoie l'existant
 * avec {@code alreadyEscalated = true}.
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
public class EscalationResponse {
    private Long nonConformityId;
    private String number;
    private boolean alreadyEscalated;
}
