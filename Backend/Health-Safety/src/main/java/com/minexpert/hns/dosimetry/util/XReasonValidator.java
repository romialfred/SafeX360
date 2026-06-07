package com.minexpert.hns.dosimetry.util;

import java.util.Set;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

import com.minexpert.hns.dosimetry.service.DosimetryAuditService;

import lombok.RequiredArgsConstructor;

/**
 * Validateur du header HTTP {@code X-Reason} pour les endpoints qui exposent des donnees
 * nominatives, medicales ou cliniques (Phase 10-A - durcissement RGPD art. 30).
 *
 * <p><b>Regles :</b>
 * <ul>
 *   <li>Header obligatoire (non null, non vide apres trim).</li>
 *   <li>Longueur minimale : 10 caracteres effectifs (apres trim).</li>
 *   <li>Liste noire des valeurs sentinelles : {@code "unspecified"}, {@code "n/a"},
 *       {@code "na"}, {@code "none"}, {@code "test"}, {@code "-"}, {@code "."} et leurs
 *       variantes de casse / espaces. Ces termes traduisent un contournement et doivent
 *       etre refuses.</li>
 *   <li>Doit contenir au moins un caractere alphabetique (eviter les "1234567890").</li>
 * </ul>
 *
 * <p>En cas d'echec, leve un {@link ResponseStatusException} 400 Bad Request avec un message
 * explicite cote API + ecrit une trace d'audit {@code INVALID_REASON} pour analyse.
 *
 * <p>Conformite : RGPD art. 30 (registry of processing activities) - tout acces aux donnees
 * sensibles doit etre justifie par une finalite explicite enregistree.
 */
@Component
@RequiredArgsConstructor
public class XReasonValidator {

    private static final Logger LOGGER = LoggerFactory.getLogger(XReasonValidator.class);

    /** Longueur minimale (apres trim) du reason valide. */
    public static final int MIN_REASON_LENGTH = 10;

    /** Liste noire des valeurs sentinelles refusees. */
    private static final Set<String> FORBIDDEN_LITERALS = Set.of(
            "unspecified", "n/a", "na", "none", "null", "test", "-", ".", "?", "...",
            "no reason", "noreason", "rien", "aucun", "nothing");

    private final DosimetryAuditService auditService;

    /**
     * Valide le header X-Reason. En cas d'echec, ecrit un audit INVALID_REASON et leve une
     * ResponseStatusException(400).
     *
     * @param reason       valeur brute du header X-Reason
     * @param userId       id utilisateur (header X-User-Id, peut etre null)
     * @param endpointPath chemin de l'endpoint pour tracabilite audit (ex. "MEDICAL_VISIT_FULL")
     * @return la valeur sanitisee (trim) si valide
     */
    public String validate(String reason, Long userId, String endpointPath) {
        if (reason == null || reason.isBlank()) {
            fail(userId, endpointPath, "MISSING", reason);
        }
        String trimmed = reason.trim();
        if (trimmed.length() < MIN_REASON_LENGTH) {
            fail(userId, endpointPath, "TOO_SHORT", trimmed);
        }
        String lower = trimmed.toLowerCase();
        if (FORBIDDEN_LITERALS.contains(lower)) {
            fail(userId, endpointPath, "FORBIDDEN_LITERAL", trimmed);
        }
        // Doit contenir au moins une lettre (refuse "1234567890" ou symboles purs).
        boolean hasAlpha = trimmed.chars().anyMatch(Character::isLetter);
        if (!hasAlpha) {
            fail(userId, endpointPath, "NO_ALPHA", trimmed);
        }
        return trimmed;
    }

    private void fail(Long userId, String endpointPath, String reasonCode, String value) {
        String details = String.format(
                "{\"endpoint\":\"%s\",\"reasonCode\":\"%s\",\"providedValue\":\"%s\"}",
                endpointPath != null ? endpointPath : "unknown",
                reasonCode,
                value != null ? value.replace("\"", "\\\"") : "null");
        LOGGER.warn("[XReasonValidator] INVALID_REASON {}", details);
        auditService.log("INVALID_REASON", "DosimetryEndpoint", null,
                userId != null ? userId : 0L, null, details);
        throw new ResponseStatusException(
                org.springframework.http.HttpStatus.BAD_REQUEST,
                "X-Reason header is required and must be at least " + MIN_REASON_LENGTH
                        + " characters of meaningful justification (RGPD art. 30).");
    }
}
