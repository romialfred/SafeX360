package com.minexpert.hns.api.emergency.entity;

import java.time.LocalDateTime;

import com.minexpert.hns.api.emergency.enums.GeneralAlertStatus;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Alerte Générale (LOT 48 Phase 4).
 *
 * <p>Une instance représente un événement d'évacuation à l'échelle de la mine.
 * Déclenchée par un utilisateur ayant la permission {@code ALERT_LAUNCHER}.
 * Tous les employés connectés reçoivent un popup global avec sirène + voix
 * TTS diffusant le message d'évacuation, et sont invités à pointer leur
 * présence à un point de rassemblement.</p>
 */
@Entity
@Table(
    name = "general_alert",
    indexes = {
        @Index(name = "idx_galert_company",  columnList = "company_id"),
        @Index(name = "idx_galert_status",   columnList = "status"),
        @Index(name = "idx_galert_company_status", columnList = "company_id,status"),
        @Index(name = "idx_galert_triggered", columnList = "triggered_at")
    }
)
@Data
@AllArgsConstructor
@NoArgsConstructor
public class GeneralAlert {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "company_id", nullable = false)
    private Long companyId;

    /** Utilisateur (lanceur d'alerte) ayant déclenché. */
    @Column(name = "triggered_by", nullable = false)
    private Long triggeredBy;

    /** Utilisateur ayant clôturé. NULL tant que l'alerte est ACTIVE. */
    @Column(name = "ended_by")
    private Long endedBy;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private GeneralAlertStatus status = GeneralAlertStatus.ACTIVE;

    /** Code raison : EVACUATION_GENERALE, INCENDIE, ACCIDENT_MAJEUR, etc. */
    @Column(name = "reason_code", length = 40)
    private String reasonCode;

    /** Message à diffuser en TTS aux employés. */
    @Column(columnDefinition = "TEXT")
    private String message;

    /** Mode exercice : ne déclenche pas de procédures externes. */
    @Column(name = "drill_mode", nullable = false)
    private Boolean drillMode = false;

    @Column(name = "triggered_at", nullable = false)
    private LocalDateTime triggeredAt;

    @Column(name = "ended_at")
    private LocalDateTime endedAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        if (triggeredAt == null) triggeredAt = now;
        updatedAt = now;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
