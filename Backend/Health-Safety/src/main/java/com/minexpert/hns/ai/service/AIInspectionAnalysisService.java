package com.minexpert.hns.ai.service;

import java.util.ArrayList;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.minexpert.hns.ai.dto.AICheckpointProposal;
import com.minexpert.hns.ai.dto.AIInspectionAnalysisResponse;
import com.minexpert.hns.ai.dto.AIInspectionReviewResponse;
import com.minexpert.hns.ai.dto.CorrectiveAction;
import com.minexpert.hns.inspections.dto.InspectionDetailDTO;
import com.minexpert.hns.inspections.service.InspectionWorkflowService;

/**
 * AIInspectionAnalysisService — Orchestrateur de l'assistance IA du module
 * Inspections (LOT 50).
 *
 * Deux flux, sur le même schéma de robustesse que AIIncidentAnalysisService :
 *  1. analyzePhoto  : photo terrain + référentiel checkpoints → propositions
 *     de constats (l'inspecteur reste décisionnaire, rien n'est écrit en base).
 *  2. reviewReport  : rapport complet → relecture critique structurée.
 *
 * Clé absente, appel en échec ou parse impossible → fallback mock dérivé des
 * données réelles de l'inspection : l'utilisateur n'est jamais bloqué.
 */
@Service
public class AIInspectionAnalysisService {

    private static final Logger log = LoggerFactory.getLogger(AIInspectionAnalysisService.class);

    /** Modèle dédié aux inspections (vision + raisonnement) — surchargable par env. */
    @Value("${anthropic.inspection-model:claude-opus-4-8}")
    private String inspectionModel;

    private static final int ANALYZE_MAX_TOKENS = 4000;
    private static final int REVIEW_MAX_TOKENS = 3000;

    private final InspectionAiPromptBuilder promptBuilder;
    private final AnthropicClient anthropicClient;
    private final AIInspectionMockFallback mockFallback;
    private final InspectionWorkflowService workflowService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public AIInspectionAnalysisService(InspectionAiPromptBuilder promptBuilder,
                                       AnthropicClient anthropicClient,
                                       AIInspectionMockFallback mockFallback,
                                       InspectionWorkflowService workflowService) {
        this.promptBuilder = promptBuilder;
        this.anthropicClient = anthropicClient;
        this.mockFallback = mockFallback;
        this.workflowService = workflowService;
    }

    public String getInspectionModel() {
        return inspectionModel;
    }

    // ─────────────────────────────────────────────────────────────────────
    // 1. Analyse photo pendant l'exécution
    // ─────────────────────────────────────────────────────────────────────

    public AIInspectionAnalysisResponse analyzePhoto(Long inspectionId, String imageBase64, String mediaType,
                                                     String zoneLabel, String language) {
        long start = System.currentTimeMillis();
        InspectionDetailDTO detail = workflowService.getDetail(inspectionId);

        log.info("[AIInspection] Analyse photo — inspection #{}, {} checkpoints, configuré={}",
                inspectionId, detail.getFindings().size(), anthropicClient.isConfigured());

        if (!anthropicClient.isConfigured()) {
            AIInspectionAnalysisResponse mock = mockFallback.buildMockAnalysis(detail, zoneLabel);
            mock.setDurationMs(System.currentTimeMillis() - start);
            return mock;
        }

        try {
            String raw = anthropicClient.analyzeImage(
                    promptBuilder.buildPhotoSystemPrompt(language),
                    promptBuilder.buildPhotoUserPrompt(detail, zoneLabel, language),
                    imageBase64,
                    mediaType != null ? mediaType : "image/jpeg",
                    inspectionModel,
                    ANALYZE_MAX_TOKENS);

            if (raw == null) {
                log.warn("[AIInspection] Réponse Anthropic nulle — fallback mock");
                AIInspectionAnalysisResponse mock = mockFallback.buildMockAnalysis(detail, zoneLabel);
                mock.setDurationMs(System.currentTimeMillis() - start);
                return mock;
            }

            AIInspectionAnalysisResponse parsed = parseAnalysis(extractJson(raw));
            parsed.setAiModel(inspectionModel);
            parsed.setFromMock(false);
            parsed.setDurationMs(System.currentTimeMillis() - start);

            log.info("[AIInspection] Analyse photo réussie — {} propositions, confidence={}, en {} ms",
                    parsed.getProposals().size(), parsed.getConfidence(), parsed.getDurationMs());
            return parsed;
        } catch (Exception e) {
            log.error("[AIInspection] Erreur analyse photo — fallback mock", e);
            AIInspectionAnalysisResponse mock = mockFallback.buildMockAnalysis(detail, zoneLabel);
            mock.setDurationMs(System.currentTimeMillis() - start);
            mock.setIrrelevanceReason("Erreur technique d'analyse — réponse de secours");
            return mock;
        }
    }

    // ─────────────────────────────────────────────────────────────────────
    // 2. Relecture critique du rapport
    // ─────────────────────────────────────────────────────────────────────

    public AIInspectionReviewResponse reviewReport(Long inspectionId, String language) {
        long start = System.currentTimeMillis();
        InspectionDetailDTO detail = workflowService.getDetail(inspectionId);

        log.info("[AIInspection] Relecture rapport — inspection #{}, statut {}, configuré={}",
                inspectionId, detail.getStatus(), anthropicClient.isConfigured());

        if (!anthropicClient.isConfigured()) {
            AIInspectionReviewResponse mock = mockFallback.buildMockReview(detail);
            mock.setDurationMs(System.currentTimeMillis() - start);
            return mock;
        }

        try {
            String raw = anthropicClient.completeText(
                    promptBuilder.buildReviewSystemPrompt(language),
                    promptBuilder.buildReviewUserPrompt(detail, language),
                    inspectionModel,
                    REVIEW_MAX_TOKENS);

            if (raw == null) {
                log.warn("[AIInspection] Réponse Anthropic nulle — fallback mock");
                AIInspectionReviewResponse mock = mockFallback.buildMockReview(detail);
                mock.setDurationMs(System.currentTimeMillis() - start);
                return mock;
            }

            AIInspectionReviewResponse parsed = parseReview(extractJson(raw));
            parsed.setAiModel(inspectionModel);
            parsed.setFromMock(false);
            parsed.setDurationMs(System.currentTimeMillis() - start);

            log.info("[AIInspection] Relecture réussie — score={}, {} lacunes, en {} ms",
                    parsed.getQualityScore(), parsed.getGaps().size(), parsed.getDurationMs());
            return parsed;
        } catch (Exception e) {
            log.error("[AIInspection] Erreur relecture rapport — fallback mock", e);
            AIInspectionReviewResponse mock = mockFallback.buildMockReview(detail);
            mock.setDurationMs(System.currentTimeMillis() - start);
            return mock;
        }
    }

    // ─────────────────────────────────────────────────────────────────────
    // Parsing manuel tolérant (même approche que AIIncidentAnalysisService)
    // ─────────────────────────────────────────────────────────────────────

    private AIInspectionAnalysisResponse parseAnalysis(String json) throws Exception {
        JsonNode root = objectMapper.readTree(json);
        AIInspectionAnalysisResponse r = new AIInspectionAnalysisResponse();

        r.setRelevant(root.path("relevant").asBoolean(true));
        r.setIrrelevanceReason(textOrNull(root, "irrelevanceReason"));
        r.setConfidence(root.path("confidence").asDouble(0.6));
        r.setOverallObservations(root.path("overallObservations").asText(""));
        r.setDetectedIssues(stringList(root.path("detectedIssues")));
        r.setSuggestedSummary(textOrNull(root, "suggestedSummary"));

        List<AICheckpointProposal> proposals = new ArrayList<>();
        JsonNode arr = root.path("proposals");
        if (arr.isArray()) {
            for (JsonNode n : arr) {
                AICheckpointProposal p = new AICheckpointProposal();
                p.setCheckpointId(n.path("checkpointId").asLong(0));
                p.setCheckpointLabel(n.path("checkpointLabel").asText(""));
                p.setObservable(n.path("observable").asBoolean(false));
                p.setProposedRawValue(textOrNull(n, "proposedRawValue"));
                p.setProposedConformity(textOrNull(n, "proposedConformity"));
                p.setObservation(n.path("observation").asText(""));
                p.setConfidence(n.path("confidence").asDouble(0.5));
                if (p.getCheckpointId() > 0) {
                    proposals.add(p);
                }
            }
        }
        r.setProposals(proposals);
        return r;
    }

    private AIInspectionReviewResponse parseReview(String json) throws Exception {
        JsonNode root = objectMapper.readTree(json);
        AIInspectionReviewResponse r = new AIInspectionReviewResponse();

        r.setQualityScore(Math.max(0, Math.min(root.path("qualityScore").asInt(60), 100)));
        r.setVerdict(root.path("verdict").asText(""));
        r.setStrengths(stringList(root.path("strengths")));
        r.setGaps(stringList(root.path("gaps")));
        r.setUnderCoveredRisks(stringList(root.path("underCoveredRisks")));
        r.setImprovements(stringList(root.path("improvements")));
        r.setIsoClauses(stringList(root.path("isoClauses")));
        r.setImprovedSummary(textOrNull(root, "improvedSummary"));

        List<CorrectiveAction> actions = new ArrayList<>();
        JsonNode arr = root.path("recommendedActions");
        if (arr.isArray()) {
            for (JsonNode n : arr) {
                actions.add(new CorrectiveAction(
                        n.path("priority").asText("P2"),
                        n.path("action").asText(""),
                        n.path("deadline").asText("7j"),
                        n.path("category").asText("ADMINISTRATIVE")));
            }
        }
        r.setRecommendedActions(actions);
        return r;
    }

    /** Extrait le bloc JSON d'une réponse texte (retire les éventuels ```json ... ```). */
    private String extractJson(String raw) {
        String s = raw.trim();
        int firstBrace = s.indexOf('{');
        int lastBrace = s.lastIndexOf('}');
        if (firstBrace >= 0 && lastBrace > firstBrace) {
            return s.substring(firstBrace, lastBrace + 1);
        }
        return s;
    }

    private List<String> stringList(JsonNode node) {
        List<String> out = new ArrayList<>();
        if (node.isArray()) {
            node.forEach(n -> {
                String v = n.asText("");
                if (!v.isBlank()) out.add(v);
            });
        }
        return out;
    }

    private String textOrNull(JsonNode node, String field) {
        JsonNode n = node.path(field);
        return n.isNull() || n.isMissingNode() ? null : n.asText();
    }
}
