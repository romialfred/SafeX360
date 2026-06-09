package com.minexpert.hns.ai.dto;

import java.util.List;

/**
 * AIAnalysisResponse — Résultat structuré de l'analyse IA d'une image HSE.
 *
 * Cette réponse pré-remplit le formulaire de déclaration d'incident.
 * L'utilisateur peut modifier chaque champ avant soumission finale.
 *
 * Le champ `confidence` (0-1) indique la confiance globale de l'IA.
 * Sous 0.5 : afficher avertissement "à vérifier soigneusement".
 *
 * Si `isHseRelevant=false`, l'IA estime que l'image ne montre pas de
 * situation HSE pertinente. Afficher le `irrelevanceReason` et inviter
 * l'utilisateur à reprendre une photo.
 */
public class AIAnalysisResponse {

    /** L'image montre-t-elle une situation HSE pertinente ? */
    private boolean isHseRelevant;

    /** Si !isHseRelevant, raison de l'écartement (ex : "image floue", "photo de personne sans contexte"). */
    private String irrelevanceReason;

    /** Confiance globale de l'IA (0-1). */
    private double confidence;

    /** Type d'incident détecté (ACCIDENT, QUASI_ACCIDENT, DANGER, NON_CONFORMITY, NEAR_MISS, INCIDENT). */
    private String incidentType;

    /** Catégorie spécifique (FALL_FROM_HEIGHT, ELECTRICAL, CHEMICAL, FIRE, MECHANICAL, EPI_MISSING, OTHER). */
    private String category;

    /** Titre court généré (≤ 80 caractères). */
    private String title;

    /** Description détaillée de la situation observée. */
    private String description;

    /** Niveau de sévérité estimé (LOW, MEDIUM, HIGH, CRITICAL). */
    private String severity;

    /** Risques HSE identifiés avec gravité/probabilité. */
    private List<IdentifiedRisk> identifiedRisks;

    /** Hypothèse de cause racine (sera affinée lors de l'investigation). */
    private String rootCauseHypothesis;

    /** Clauses ISO applicables (ex : ["ISO 45001 §8.1.2", "ISO 45001 §6.1.2.1"]). */
    private List<String> isoClauses;

    /** Actions correctives proposées, ordonnées par priorité (P0 → P3). */
    private List<CorrectiveAction> correctiveActions;

    /** Plan de remédiation détaillé en étapes (texte multi-lignes). */
    private String remediationPlan;

    /** Indique si la réponse vient du fallback mock (clé API absente). */
    private boolean fromMock;

    /** Modèle IA utilisé (ex : "claude-sonnet-4-5-20250929", "mock-v1"). */
    private String aiModel;

    /** Durée d'analyse en millisecondes (pour métriques). */
    private long durationMs;

    // ─────────────────────────────────────────────────────────────────────
    // Getters / Setters
    // ─────────────────────────────────────────────────────────────────────

    public boolean isHseRelevant() { return isHseRelevant; }
    public void setHseRelevant(boolean hseRelevant) { isHseRelevant = hseRelevant; }

    public String getIrrelevanceReason() { return irrelevanceReason; }
    public void setIrrelevanceReason(String irrelevanceReason) { this.irrelevanceReason = irrelevanceReason; }

    public double getConfidence() { return confidence; }
    public void setConfidence(double confidence) { this.confidence = confidence; }

    public String getIncidentType() { return incidentType; }
    public void setIncidentType(String incidentType) { this.incidentType = incidentType; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getSeverity() { return severity; }
    public void setSeverity(String severity) { this.severity = severity; }

    public List<IdentifiedRisk> getIdentifiedRisks() { return identifiedRisks; }
    public void setIdentifiedRisks(List<IdentifiedRisk> identifiedRisks) { this.identifiedRisks = identifiedRisks; }

    public String getRootCauseHypothesis() { return rootCauseHypothesis; }
    public void setRootCauseHypothesis(String rootCauseHypothesis) { this.rootCauseHypothesis = rootCauseHypothesis; }

    public List<String> getIsoClauses() { return isoClauses; }
    public void setIsoClauses(List<String> isoClauses) { this.isoClauses = isoClauses; }

    public List<CorrectiveAction> getCorrectiveActions() { return correctiveActions; }
    public void setCorrectiveActions(List<CorrectiveAction> correctiveActions) { this.correctiveActions = correctiveActions; }

    public String getRemediationPlan() { return remediationPlan; }
    public void setRemediationPlan(String remediationPlan) { this.remediationPlan = remediationPlan; }

    public boolean isFromMock() { return fromMock; }
    public void setFromMock(boolean fromMock) { this.fromMock = fromMock; }

    public String getAiModel() { return aiModel; }
    public void setAiModel(String aiModel) { this.aiModel = aiModel; }

    public long getDurationMs() { return durationMs; }
    public void setDurationMs(long durationMs) { this.durationMs = durationMs; }
}
