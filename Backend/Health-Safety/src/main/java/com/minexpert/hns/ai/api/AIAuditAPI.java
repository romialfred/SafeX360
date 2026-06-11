package com.minexpert.hns.ai.api;

import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.minexpert.hns.ai.service.AIAuditService;
import com.minexpert.hns.ai.service.AnthropicClient;
import com.minexpert.hns.exception.HSException;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;

/**
 * LOT 53 — Assistance IA du module Audits (via gateway /hns/ai-audits).
 *
 * <p>Comme pour les inspections (LOT 50) : l'IA est une MÉTHODE OPTIONNELLE —
 * elle propose, l'auditeur applique. Sans clé API, repli démo étiqueté.</p>
 *
 * <ul>
 *   <li>GET  /ai-audits/status — configuration IA</li>
 *   <li>POST /ai-audits/observations/suggest-classification — classification ISO proposée</li>
 *   <li>POST /ai-audits/{auditId}/review-report — relecture du rapport (§6.5)</li>
 * </ul>
 */
@RestController
@RequestMapping("/ai-audits")
@CrossOrigin
@RequiredArgsConstructor
public class AIAuditAPI {

    private final AIAuditService aiAuditService;
    private final AnthropicClient anthropicClient;

    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> getStatus() {
        return ResponseEntity.ok(Map.of(
                "configured", anthropicClient.isConfigured(),
                "model", aiAuditService.getAuditModel(),
                "provider", "anthropic",
                "fallback", "mock"
        ));
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SuggestClassificationRequest {
        private String title;
        private String observedFact;
        /** Référentiel pour ancrer la clause proposée (ISO_45001, ISO_14001, ISO_9001, MINIER). */
        private String referential;
    }

    @PostMapping("/observations/suggest-classification")
    public ResponseEntity<Map<String, Object>> suggestClassification(
            @RequestBody SuggestClassificationRequest request) {
        return ResponseEntity.ok(aiAuditService.suggestClassification(
                request.getTitle(), request.getObservedFact(), request.getReferential()));
    }

    @PostMapping("/{auditId}/review-report")
    public ResponseEntity<Map<String, Object>> reviewReport(@PathVariable Long auditId) throws HSException {
        return ResponseEntity.ok(aiAuditService.reviewReport(auditId));
    }
}
