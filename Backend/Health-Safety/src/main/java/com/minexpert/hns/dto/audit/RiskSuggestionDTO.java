package com.minexpert.hns.dto.audit;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * LOT 52 — Suggestion de priorisation basée risques pour un domaine d'audit
 * (ISO 19011:2026 — risques et opportunités du programme d'audit).
 *
 * <p>Score = (non-conformités ouvertes liées au domaine, sinon total) × 2
 * + mois écoulés depuis le dernier audit CLOSED couvrant le domaine (plafonné à 24).
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
public class RiskSuggestionDTO {
    private Long areaId;
    private String areaName;
    /** Non-conformités ouvertes prises en compte dans le score. */
    private long openNonConformities;
    /** Mois depuis le dernier audit clôturé couvrant ce domaine (24 si jamais audité). */
    private int monthsSinceLastClosedAudit;
    private int score;
    /** TRIMESTRIEL (score &gt; 30), SEMESTRIEL (score &gt; 15), sinon ANNUEL. */
    private String suggestedFrequency;
}
