package com.minexpert.hns.ai.service;

import java.time.Duration;
import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

/**
 * AnthropicClient — Client REST pour l'API Anthropic Claude Vision.
 *
 * Documentation : https://docs.anthropic.com/en/api/messages
 *
 * Endpoint utilisé : POST https://api.anthropic.com/v1/messages
 * Modèle par défaut : claude-sonnet-4-5
 *
 * Headers requis :
 *  - x-api-key : clé API Anthropic
 *  - anthropic-version : 2023-06-01
 *  - content-type : application/json
 *
 * Si ANTHROPIC_API_KEY est absent, le service retourne null et le service appelant
 * doit basculer sur le mock fallback.
 */
@Component
public class AnthropicClient {

    private static final Logger log = LoggerFactory.getLogger(AnthropicClient.class);

    private static final String API_URL = "https://api.anthropic.com/v1/messages";
    private static final String ANTHROPIC_VERSION = "2023-06-01";

    @Value("${ANTHROPIC_API_KEY:}")
    private String apiKey;

    @Value("${anthropic.model:claude-sonnet-4-5}")
    private String model;

    @Value("${anthropic.max-tokens:2400}")
    private int maxTokens;

    @Value("${anthropic.timeout-seconds:90}")
    private int timeoutSeconds;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private RestTemplate restTemplate;

    /** True si une clé API valide est configurée (format sk-ant-...). */
    public boolean isConfigured() {
        return apiKey != null && !apiKey.isBlank() && apiKey.startsWith("sk-ant-");
    }

    public String getModel() {
        return model;
    }

    private RestTemplate getRestTemplate() {
        if (restTemplate == null) {
            restTemplate = new RestTemplateBuilder()
                    .connectTimeout(Duration.ofSeconds(10))
                    .readTimeout(Duration.ofSeconds(timeoutSeconds))
                    .build();
        }
        return restTemplate;
    }

    /**
     * Analyse une image avec Claude Vision (modèle et max_tokens par défaut).
     *
     * @param systemPrompt prompt système (rôle expert HSE)
     * @param userPrompt prompt utilisateur (contexte spécifique)
     * @param imageBase64 image encodée en base64 sans préfixe data:
     * @param mediaType type MIME (image/jpeg, image/png, image/webp, image/gif)
     * @return Texte de la réponse (attendu : JSON strict) ou null si erreur
     */
    public String analyzeImage(String systemPrompt, String userPrompt, String imageBase64, String mediaType) {
        return analyzeImage(systemPrompt, userPrompt, imageBase64, mediaType, null, null);
    }

    /**
     * Analyse une image avec Claude Vision, avec surcharge optionnelle du
     * modèle et du plafond de tokens (utilisé par le module Inspections qui
     * cible un modèle plus capable et des réponses plus longues).
     */
    public String analyzeImage(String systemPrompt, String userPrompt, String imageBase64, String mediaType,
                               String modelOverride, Integer maxTokensOverride) {
        Map<String, Object> imageBlock = Map.of(
                "type", "image",
                "source", Map.of(
                        "type", "base64",
                        "media_type", mediaType,
                        "data", imageBase64
                )
        );
        Map<String, Object> textBlock = Map.of(
                "type", "text",
                "text", userPrompt
        );
        return call(systemPrompt, List.of(imageBlock, textBlock), modelOverride, maxTokensOverride,
                "image=" + imageBase64.length() + " bytes (b64)");
    }

    /**
     * Complétion texte seule (sans image) — relecture de rapports, synthèses.
     */
    public String completeText(String systemPrompt, String userPrompt,
                               String modelOverride, Integer maxTokensOverride) {
        Map<String, Object> textBlock = Map.of(
                "type", "text",
                "text", userPrompt
        );
        return call(systemPrompt, List.of(textBlock), modelOverride, maxTokensOverride,
                "texte=" + userPrompt.length() + " chars");
    }

    /** Appel générique POST /v1/messages avec extraction du premier bloc texte. */
    private String call(String systemPrompt, List<Map<String, Object>> contentBlocks,
                        String modelOverride, Integer maxTokensOverride, String logDetail) {
        if (!isConfigured()) {
            log.warn("[AnthropicClient] ANTHROPIC_API_KEY non configurée — appel API refusé.");
            return null;
        }

        String effectiveModel = modelOverride != null && !modelOverride.isBlank() ? modelOverride : model;
        int effectiveMaxTokens = maxTokensOverride != null && maxTokensOverride > 0 ? maxTokensOverride : maxTokens;

        try {
            Map<String, Object> message = Map.of(
                    "role", "user",
                    "content", contentBlocks
            );

            Map<String, Object> body = Map.of(
                    "model", effectiveModel,
                    "max_tokens", effectiveMaxTokens,
                    "system", systemPrompt,
                    "messages", List.of(message)
            );

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("x-api-key", apiKey);
            headers.set("anthropic-version", ANTHROPIC_VERSION);

            log.info("[AnthropicClient] Appel API : model={}, {}", effectiveModel, logDetail);
            long start = System.currentTimeMillis();

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);
            ResponseEntity<String> response = getRestTemplate().exchange(
                    API_URL, HttpMethod.POST, entity, String.class
            );

            long duration = System.currentTimeMillis() - start;
            log.info("[AnthropicClient] Réponse reçue en {} ms (status {})", duration, response.getStatusCode().value());

            String payload = response.getBody();
            if (payload == null) {
                return null;
            }

            JsonNode root = objectMapper.readTree(payload);
            JsonNode content = root.path("content");
            if (content.isArray() && content.size() > 0) {
                JsonNode first = content.get(0);
                if ("text".equals(first.path("type").asText())) {
                    return first.path("text").asText();
                }
            }

            log.warn("[AnthropicClient] Format réponse inattendu : {}", payload);
            return null;
        } catch (Exception e) {
            log.error("[AnthropicClient] Exception appel API : {}", e.getMessage());
            return null;
        }
    }
}
