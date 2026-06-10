package com.minexpert.hns.ai.dto;

import java.util.ArrayList;
import java.util.List;

import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * AIInspectionReviewResponse — Relecture critique d'un rapport d'inspection
 * par l'IA : évaluation de la qualité, lacunes, risques sous-couverts et
 * suggestions d'amélioration.
 *
 * <p>Purement consultatif : aucune écriture en base. Sert l'amélioration
 * continue (ISO 45001 §10.3) et la préparation de la validation collégiale.</p>
 */
@Data
@NoArgsConstructor
public class AIInspectionReviewResponse {

    /** Score de qualité globale du rapport (0 à 100). */
    private int qualityScore;

    /** Verdict en une phrase. */
    private String verdict;

    /** Points forts du rapport. */
    private List<String> strengths = new ArrayList<>();

    /** Lacunes : points non renseignés, notes manquantes, incohérences. */
    private List<String> gaps = new ArrayList<>();

    /** Risques insuffisamment couverts par l'inspection. */
    private List<String> underCoveredRisks = new ArrayList<>();

    /** Suggestions concrètes d'amélioration du rapport. */
    private List<String> improvements = new ArrayList<>();

    /** Actions correctives recommandées pour les non-conformités relevées. */
    private List<CorrectiveAction> recommendedActions = new ArrayList<>();

    /** Clauses ISO 45001 applicables aux constats. */
    private List<String> isoClauses = new ArrayList<>();

    /** Proposition de synthèse améliorée, prête à l'emploi. */
    private String improvedSummary;

    // ── Traçabilité ──
    /** True si la réponse provient du mock de secours (pas de clé API). */
    private boolean fromMock;

    /** Modèle IA utilisé. */
    private String aiModel;

    /** Durée totale de l'analyse en millisecondes. */
    private long durationMs;
}
