package com.minexpert.hns.ai.api;

import java.util.Base64;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.minexpert.hns.ai.dto.AIInspectionAnalysisResponse;
import com.minexpert.hns.ai.dto.AIInspectionReviewResponse;
import com.minexpert.hns.ai.service.AIInspectionAnalysisService;
import com.minexpert.hns.ai.service.AnthropicClient;
import com.minexpert.hns.inspections.config.InspectionRBACConfig;

/**
 * AIInspectionAPI — Endpoints REST de l'assistance IA du module Inspections
 * (LOT 50).
 *
 * Endpoints :
 *   GET  /ai-inspections/status                  → état de configuration IA
 *   POST /ai-inspections/{id}/analyze-photo      → analyse d'une photo terrain
 *   POST /ai-inspections/{id}/review-report      → relecture critique du rapport
 *
 * Sécurité : mêmes permissions RBAC que le workflow d'inspection —
 * INSPECTION_EXECUTE pour l'assistance terrain, INSPECTION_VIEW pour la
 * relecture (consultatif). Aucune écriture en base : l'IA propose, le
 * frontend pré-remplit, l'inspecteur valide via les endpoints existants.
 */
@RestController
@RequestMapping("/ai-inspections")
@CrossOrigin
public class AIInspectionAPI {

    private static final Logger log = LoggerFactory.getLogger(AIInspectionAPI.class);

    private static final long MAX_FILE_BYTES = 10L * 1024 * 1024; // 10 MB

    private final AIInspectionAnalysisService service;
    private final AnthropicClient anthropicClient;

    public AIInspectionAPI(AIInspectionAnalysisService service, AnthropicClient anthropicClient) {
        this.service = service;
        this.anthropicClient = anthropicClient;
    }

    /** Indique si l'assistance IA est configurée (clé API valide). */
    @PreAuthorize("hasAuthority('" + InspectionRBACConfig.INSPECTION_VIEW + "')")
    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> getStatus() {
        return ResponseEntity.ok(Map.of(
                "configured", anthropicClient.isConfigured(),
                "model", service.getInspectionModel(),
                "provider", "anthropic",
                "fallback", "mock"
        ));
    }

    /**
     * Analyse une photo prise pendant l'exécution d'une inspection et propose
     * des constats par checkpoint. Multipart : image (obligatoire),
     * zoneLabel (partie photographiée, optionnel), language (fr|en).
     */
    @PreAuthorize("hasAuthority('" + InspectionRBACConfig.INSPECTION_EXECUTE + "')")
    @PostMapping("/{id}/analyze-photo")
    public ResponseEntity<?> analyzePhoto(
            @PathVariable Long id,
            @RequestParam("image") MultipartFile image,
            @RequestParam(value = "zoneLabel", required = false) String zoneLabel,
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
            log.info("[API /ai-inspections/{}/analyze-photo] Image reçue : {} ({} KB), zone='{}'",
                    id, image.getOriginalFilename(), image.getSize() / 1024, zoneLabel);

            AIInspectionAnalysisResponse response =
                    service.analyzePhoto(id, base64, contentType, zoneLabel, language);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("[API /ai-inspections/{}/analyze-photo] Erreur traitement image", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Erreur traitement image : " + e.getMessage()));
        }
    }

    /** Relecture critique du rapport d'inspection (consultatif, aucune écriture). */
    @PreAuthorize("hasAuthority('" + InspectionRBACConfig.INSPECTION_VIEW + "')")
    @PostMapping("/{id}/review-report")
    public ResponseEntity<?> reviewReport(
            @PathVariable Long id,
            @RequestParam(value = "language", required = false, defaultValue = "fr") String language
    ) {
        try {
            AIInspectionReviewResponse response = service.reviewReport(id, language);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("[API /ai-inspections/{}/review-report] Erreur relecture", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Erreur relecture rapport : " + e.getMessage()));
        }
    }

    private boolean isSupportedImage(String contentType) {
        return contentType.equals("image/jpeg")
                || contentType.equals("image/png")
                || contentType.equals("image/webp")
                || contentType.equals("image/gif");
    }
}
