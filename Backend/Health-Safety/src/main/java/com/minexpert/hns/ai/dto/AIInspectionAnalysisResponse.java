package com.minexpert.hns.ai.dto;

import java.util.ArrayList;
import java.util.List;

import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * AIInspectionAnalysisResponse — Résultat d'analyse IA d'une photo prise
 * pendant l'exécution d'une inspection (équipement, local ou procédure).
 *
 * <p>Contient des propositions de constats par checkpoint, des observations
 * globales et une synthèse suggérée. Rien n'est écrit en base : le frontend
 * applique ces propositions dans le formulaire d'exécution existant, que
 * l'inspecteur peut corriger librement avant sauvegarde.</p>
 */
@Data
@NoArgsConstructor
public class AIInspectionAnalysisResponse {

    /** True si la photo correspond bien à la cible inspectée. */
    private boolean relevant = true;

    /** Raison si la photo est jugée hors sujet. */
    private String irrelevanceReason;

    /** Confiance globale de l'analyse (0.0 à 1.0). */
    private double confidence;

    /** Description factuelle de ce que montre la photo. */
    private String overallObservations;

    /** Anomalies ou points de vigilance détectés, hors checkpoints. */
    private List<String> detectedIssues = new ArrayList<>();

    /** Propositions de constats par checkpoint observable. */
    private List<AICheckpointProposal> proposals = new ArrayList<>();

    /** Synthèse d'inspection suggérée (réutilisable dans summaryReport). */
    private String suggestedSummary;

    // ── Traçabilité ──
    /** True si la réponse provient du mock de secours (pas de clé API). */
    private boolean fromMock;

    /** Modèle IA utilisé (ex : claude-opus-4-8). */
    private String aiModel;

    /** Durée totale de l'analyse en millisecondes. */
    private long durationMs;
}
