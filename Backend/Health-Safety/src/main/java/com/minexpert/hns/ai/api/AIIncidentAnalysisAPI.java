package com.minexpert.hns.ai.api;

import java.util.Base64;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.minexpert.hns.ai.dto.AIAnalysisRequest;
import com.minexpert.hns.ai.dto.AIAnalysisResponse;
import com.minexpert.hns.ai.service.AIIncidentAnalysisService;
import com.minexpert.hns.ai.service.AnthropicClient;

/**
 * AIIncidentAnalysisAPI — Endpoints REST pour l'analyse IA d'incidents HSE.
 *
 * Endpoints :
 *   GET  /ai-incidents/status     → vérifier si l'API IA est configurée
 *   POST /ai-incidents/analyze    → analyse multipart (image + contexte)
 *
 * Taille max image : 10 MB (configurable via spring.servlet.multipart.max-file-size).
 * Formats supportés : image/jpeg, image/png, image/webp, image/gif.
 */
@RestController
@RequestMapping("/ai-incidents")
@CrossOrigin
public class AIIncidentAnalysisAPI {

    private static final Logger log = LoggerFactory.getLogger(AIIncidentAnalysisAPI.class);

    private static final long MAX_FILE_BYTES = 10L * 1024 * 1024; // 10 MB

    private final AIIncidentAnalysisService service;
    private final AnthropicClient anthropicClient;

    @Autowired
    public AIIncidentAnalysisAPI(AIIncidentAnalysisService service, AnthropicClient anthropicClient) {
        this.service = service;
        this.anthropicClient = anthropicClient;
    }

    /** Indique si l'API IA est correctement configurée (clé valide). */
    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> getStatus() {
        return ResponseEntity.ok(Map.of(
                "configured", anthropicClient.isConfigured(),
                "model", anthropicClient.getModel(),
                "provider", "anthropic",
                "fallback", "mock"
        ));
    }

    /** Analyse une image HSE en multipart/form-data. */
    @PostMapping("/analyze")
    public ResponseEntity<?> analyze(
            @RequestParam("image") MultipartFile image,
            @RequestParam(value = "mineContext", required = false) String mineContext,
            @RequestParam(value = "departmentContext", required = false) String departmentContext,
            @RequestParam(value = "userContext", required = false) String userContext,
            @RequestParam(value = "language", required = false, defaultValue = "fr") String language
    ) {
        if (image == null || image.isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "Image manquante"));
        }
        if (image.getSize() > MAX_FILE_BYTES) {
            return ResponseEntity.status(HttpStatus.PAYLOAD_TOO_LARGE)
                    .body(Map.of("error", "Image trop volumineuse (max 10 MB)"));
        }
        String contentType = image.getContentType();
        if (contentType == null || !isSupportedImage(contentType)) {
            return ResponseEntity.status(HttpStatus.UNSUPPORTED_MEDIA_TYPE)
                    .body(Map.of("error", "Format non supporté (image/jpeg, png, webp, gif)"));
        }

        try {
            String base64 = Base64.getEncoder().encodeToString(image.getBytes());
            AIAnalysisRequest req = new AIAnalysisRequest();
            req.setImageBase64(base64);
            req.setMediaType(contentType);
            req.setMineContext(mineContext);
            req.setDepartmentContext(departmentContext);
            req.setUserContext(userContext);
            req.setLanguage(language);

            log.info("[API /ai-incidents/analyze] Image reçue : {} ({} KB)", image.getOriginalFilename(), image.getSize() / 1024);

            AIAnalysisResponse response = service.analyze(req);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("[API /ai-incidents/analyze] Erreur lecture image", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Erreur traitement image : " + e.getMessage()));
        }
    }

    private boolean isSupportedImage(String contentType) {
        return contentType.equals("image/jpeg")
                || contentType.equals("image/png")
                || contentType.equals("image/webp")
                || contentType.equals("image/gif");
    }
}
