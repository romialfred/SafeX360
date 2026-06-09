package com.minexpert.hns.ai.dto;

/**
 * AIAnalysisRequest — Requête pour analyse IA d'une situation HSE à partir d'une image.
 *
 * L'image est transmise en base64 (encodage standard) avec son media type
 * (ex : "image/jpeg", "image/png"). Les champs de contexte sont optionnels mais
 * améliorent la précision de l'analyse Claude (mine, département, contexte libre).
 *
 * Phase 1 module IA — déclaration assistée par IA.
 */
public class AIAnalysisRequest {

    /** Image encodée en base64 (sans préfixe data: URI). */
    private String imageBase64;

    /** Type MIME de l'image (image/jpeg, image/png, image/webp, image/gif). */
    private String mediaType;

    /** Contexte optionnel : nom du site / mine concernée. */
    private String mineContext;

    /** Contexte optionnel : département / zone d'exploitation. */
    private String departmentContext;

    /** Contexte optionnel : commentaire libre du déclarant. */
    private String userContext;

    /** Langue souhaitée pour la réponse IA (fr, en). Défaut fr. */
    private String language = "fr";

    // ─────────────────────────────────────────────────────────────────────
    // Getters / Setters
    // ─────────────────────────────────────────────────────────────────────

    public String getImageBase64() { return imageBase64; }
    public void setImageBase64(String imageBase64) { this.imageBase64 = imageBase64; }

    public String getMediaType() { return mediaType; }
    public void setMediaType(String mediaType) { this.mediaType = mediaType; }

    public String getMineContext() { return mineContext; }
    public void setMineContext(String mineContext) { this.mineContext = mineContext; }

    public String getDepartmentContext() { return departmentContext; }
    public void setDepartmentContext(String departmentContext) { this.departmentContext = departmentContext; }

    public String getUserContext() { return userContext; }
    public void setUserContext(String userContext) { this.userContext = userContext; }

    public String getLanguage() { return language; }
    public void setLanguage(String language) { this.language = language; }
}
