package com.minexpert.hns.api.emergency.entity;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Paramètres globaux du module Urgences, <strong>singleton par mine</strong>
 * (LOT 48 Phase 1).
 *
 * <p>Couvre :</p>
 * <ul>
 *   <li>délai avant escalade auto ({@code autoDispatchSeconds}),</li>
 *   <li>activation du mode <em>drill</em>,</li>
 *   <li>méthode de head-count (GPS / QR / NFC / manuel),</li>
 *   <li>rétention journal audit (5 ans par défaut — ADR-008),</li>
 *   <li>provider SMS (Africa's Talking — ADR-005),</li>
 *   <li>provider TTS voix (Azure Speech fr-FR-DeniseNeural).</li>
 * </ul>
 */
@Entity
@Table(name = "emergency_settings")
@Data
@AllArgsConstructor
@NoArgsConstructor
public class EmergencySettings {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "company_id", nullable = false, unique = true)
    private Long companyId;

    @Column(name = "auto_dispatch_seconds", nullable = false)
    private Integer autoDispatchSeconds = 120;

    @Column(name = "drill_mode_enabled", nullable = false)
    private Boolean drillModeEnabled = Boolean.FALSE;

    @Column(name = "head_count_method", nullable = false, length = 20)
    private String headCountMethod = "GPS";

    @Column(name = "geolocation_required", nullable = false)
    private Boolean geolocationRequired = Boolean.TRUE;

    @Column(name = "audit_retention_years", nullable = false)
    private Integer auditRetentionYears = 5;

    @Column(name = "sms_provider", length = 40)
    private String smsProvider;

    @Column(name = "sms_sender_id", length = 40)
    private String smsSenderId;

    @Column(name = "voice_provider", length = 40)
    private String voiceProvider;

    @Column(name = "voice_locale", nullable = false, length = 20)
    private String voiceLocale = "fr-FR";

    @Column(name = "voice_voice_name", nullable = false, length = 60)
    private String voiceVoiceName = "fr-FR-DeniseNeural";

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        if (createdAt == null) createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
