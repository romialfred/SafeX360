package com.minexpert.hns.ai.service;

import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.minexpert.hns.ai.dto.AIAnalysisRequest;
import com.minexpert.hns.ai.dto.AIAnalysisResponse;
import com.minexpert.hns.ai.dto.CorrectiveAction;
import com.minexpert.hns.ai.dto.IdentifiedRisk;

/**
 * AIIncidentAnalysisService — Orchestrateur de l'analyse IA HSE.
 *
 * Workflow :
 *  1. Construit le prompt système + user (HsePromptBuilder)
 *  2. Si clé API Anthropic configurée → appel Claude Vision
 *     2a. Parse la réponse JSON → AIAnalysisResponse
 *     2b. Si parse fail → fallback mock + log warning
 *  3. Sinon → fallback mock direct (AIMockFallback)
 *
 * Toute exception est interceptée et convertie en mock fallback pour ne
 * jamais bloquer l'utilisateur final.
 */
@Service
public class AIIncidentAnalysisService {

    private static final Logger log = LoggerFactory.getLogger(AIIncidentAnalysisService.class);

    private final HsePromptBuilder promptBuilder;
    private final AnthropicClient anthropicClient;
    private final AIMockFallback mockFallback;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Autowired
    public AIIncidentAnalysisService(
            HsePromptBuilder promptBuilder,
            AnthropicClient anthropicClient,
            AIMockFallback mockFallback
    ) {
        this.promptBuilder = promptBuilder;
        this.anthropicClient = anthropicClient;
        this.mockFallback = mockFallback;
    }

    /**
     * Analyse une image HSE et retourne une réponse structurée.
     * Garantit qu'une réponse non-nulle est toujours retournée.
     */
    public AIAnalysisResponse analyze(AIAnalysisRequest request) {
        long start = System.currentTimeMillis();
        int imageSizeKb = request.getImageBase64() != null ? request.getImageBase64().length() / 1024 : 0;

        log.info("[AIAnalysis] Démarrage analyse — image {} Ko, langue {}, configuré={}",
                imageSizeKb, request.getLanguage(), anthropicClient.isConfigured());

        if (!anthropicClient.isConfigured()) {
            log.info("[AIAnalysis] Mode mock (ANTHROPIC_API_KEY absente)");
            AIAnalysisResponse mock = mockFallback.buildMockResponse(imageSizeKb, request.getMineContext());
            mock.setDurationMs(System.currentTimeMillis() - start);
            return mock;
        }

        try {
            String systemPrompt = promptBuilder.buildSystemPrompt(request.getLanguage());
            String userPrompt = promptBuilder.buildUserPrompt(request);

            String rawResponse = anthropicClient.analyzeImage(
                    systemPrompt,
                    userPrompt,
                    request.getImageBase64(),
                    request.getMediaType() != null ? request.getMediaType() : "image/jpeg"
            );

            if (rawResponse == null) {
                log.warn("[AIAnalysis] Réponse Anthropic nulle — fallback mock");
                AIAnalysisResponse mock = mockFallback.buildMockResponse(imageSizeKb, request.getMineContext());
                mock.setDurationMs(System.currentTimeMillis() - start);
                return mock;
            }

            // Extrait le JSON de la réponse (peut être entouré de markdown ```json ... ```)
            String json = extractJson(rawResponse);
            AIAnalysisResponse parsed = parseAiResponse(json);
            parsed.setAiModel(anthropicClient.getModel());
            parsed.setFromMock(false);
            parsed.setDurationMs(System.currentTimeMillis() - start);

            log.info("[AIAnalysis] Analyse réussie — confidence={}, severity={}, en {} ms",
                    parsed.getConfidence(), parsed.getSeverity(), parsed.getDurationMs());

            return parsed;
        } catch (Exception e) {
            log.error("[AIAnalysis] Erreur — fallback mock", e);
            AIAnalysisResponse mock = mockFallback.buildMockResponse(imageSizeKb, request.getMineContext());
            mock.setDurationMs(System.currentTimeMillis() - start);
            mock.setIrrelevanceReason("Erreur technique d'analyse — réponse de secours");
            return mock;
        }
    }

    /** Extrait le bloc JSON d'une réponse texte, en retirant les éventuels ```json ... ```. */
    private String extractJson(String raw) {
        String s = raw.trim();
        // Cas markdown ```json
        if (s.startsWith("```")) {
            int firstBrace = s.indexOf('{');
            int lastBrace = s.lastIndexOf('}');
            if (firstBrace >= 0 && lastBrace > firstBrace) {
                return s.substring(firstBrace, lastBrace + 1);
            }
        }
        // Cas texte avec JSON quelque part
        int firstBrace = s.indexOf('{');
        int lastBrace = s.lastIndexOf('}');
        if (firstBrace >= 0 && lastBrace > firstBrace) {
            return s.substring(firstBrace, lastBrace + 1);
        }
        return s;
    }

    /** Parse manuellement la réponse JSON pour gérer les variations de format. */
    private AIAnalysisResponse parseAiResponse(String json) throws Exception {
        JsonNode root = objectMapper.readTree(json);
        AIAnalysisResponse r = new AIAnalysisResponse();

        r.setHseRelevant(root.path("isHseRelevant").asBoolean(true));
        r.setIrrelevanceReason(textOrNull(root, "irrelevanceReason"));
        r.setConfidence(root.path("confidence").asDouble(0.7));
        r.setIncidentType(root.path("incidentType").asText("DANGER"));
        r.setCategory(root.path("category").asText("OTHER"));
        r.setTitle(root.path("title").asText("Situation HSE détectée"));
        r.setDescription(root.path("description").asText(""));
        r.setSeverity(root.path("severity").asText("MEDIUM"));
        r.setRootCauseHypothesis(textOrNull(root, "rootCauseHypothesis"));
        r.setRemediationPlan(textOrNull(root, "remediationPlan"));

        // Risques identifiés
        JsonNode risksNode = root.path("identifiedRisks");
        if (risksNode.isArray()) {
            java.util.ArrayList<IdentifiedRisk> risks = new java.util.ArrayList<>();
            risksNode.forEach(n -> risks.add(new IdentifiedRisk(
                    n.path("risk").asText(""),
                    n.path("gravity").asInt(3),
                    n.path("probability").asInt(3)
            )));
            r.setIdentifiedRisks(risks);
        } else {
            r.setIdentifiedRisks(List.of());
        }

        // Clauses ISO
        JsonNode isoNode = root.path("isoClauses");
        if (isoNode.isArray()) {
            java.util.ArrayList<String> iso = new java.util.ArrayList<>();
            isoNode.forEach(n -> iso.add(n.asText()));
            r.setIsoClauses(iso);
        } else {
            r.setIsoClauses(List.of());
        }

        // Actions correctives
        JsonNode actionsNode = root.path("correctiveActions");
        if (actionsNode.isArray()) {
            java.util.ArrayList<CorrectiveAction> actions = new java.util.ArrayList<>();
            actionsNode.forEach(n -> actions.add(new CorrectiveAction(
                    n.path("priority").asText("P2"),
                    n.path("action").asText(""),
                    n.path("deadline").asText("7j"),
                    n.path("category").asText("ADMINISTRATIVE")
            )));
            r.setCorrectiveActions(actions);
        } else {
            r.setCorrectiveActions(List.of());
        }

        return r;
    }

    private String textOrNull(JsonNode node, String field) {
        JsonNode n = node.path(field);
        return n.isNull() || n.isMissingNode() ? null : n.asText();
    }
}
