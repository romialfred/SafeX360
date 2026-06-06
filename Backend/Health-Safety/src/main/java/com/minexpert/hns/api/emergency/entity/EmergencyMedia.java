package com.minexpert.hns.api.emergency.entity;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Média d'urgence (sirène ou message vocal) — LOT 48 Phase 1.e.
 *
 * <p>Deux types principaux :</p>
 * <ul>
 *   <li>{@code SIREN}    — fichier audio de sirène (boucle alerte générale)</li>
 *   <li>{@code VOICE_MESSAGE} — message vocal d'évacuation (TTS ou enregistré)</li>
 * </ul>
 *
 * <p>Le champ {@code ttsText} permet la génération à la demande via Azure
 * Speech (ADR-005bis). Le champ {@code filePath} pointe vers l'asset stocké.</p>
 */
@Entity
@Table(
    name = "emergency_media",
    indexes = @Index(name = "idx_em_company", columnList = "company_id, media_type, locale")
)
@Data
@AllArgsConstructor
@NoArgsConstructor
public class EmergencyMedia {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "company_id", nullable = false)
    private Long companyId;

    @Column(name = "media_type", nullable = false, length = 20)
    private String mediaType; // SIREN | VOICE_MESSAGE

    @Column(nullable = false, length = 20)
    private String locale = "fr-FR";

    @Column(nullable = false, length = 120)
    private String label;

    @Column(name = "file_path")
    private String filePath;

    @Column(name = "tts_text", columnDefinition = "TEXT")
    private String ttsText;

    @Column(name = "is_default", nullable = false)
    private Boolean isDefault = Boolean.FALSE;

    @Column(nullable = false, length = 20)
    private String status = "ACTIVE";

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
    }
}
