package com.minexpert.hns.dto.audit;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * LOT 52 — Résultat de la validation d'équipe d'audit : conforme ou liste
 * des violations (messages en français destinés à l'utilisateur).
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
public class ValidateTeamResponse {
    private boolean valid;
    private List<String> violations;
}
