package com.minexpert.hns.api.emergency.entity;

import java.time.LocalDateTime;

import com.minexpert.hns.api.emergency.enums.SosStatus;

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
 * Alerte SOS individuelle (LOT 48 Phase 3.a).
 *
 * <p>Une instance représente <strong>une demande de secours</strong> émise par
 * un employé (mobile-first via PWA, fallback web). Le cycle de vie est tracé
 * via les horodatages de transition + la liste des {@link SosLifecycleEvent}.</p>
 *
 * <p>Champs critiques :</p>
 * <ul>
 *   <li>{@code latitude}/{@code longitude} : capture GPS au moment du SOS</li>
 *   <li>{@code reasonCode} : enum string (médical, agression, accident, etc.)</li>
 *   <li>{@code description} : message libre optionnel saisi par l'employé</li>
 *   <li>{@code coordinatorId} : assigné au premier acknowledge (FCFS)</li>
 *   <li>{@code rescueTeamId} : équipe dispatchée Phase {@code DISPATCHED}</li>
 *   <li>{@code falseAlarmReason} : raison fausse alerte (sinon NULL)</li>
 * </ul>
 *
 * <p>Index dédiés sur {@code (company_id, status)} pour la requête principale
 * "alertes actives par mine" et sur {@code triggered_at} pour les statistiques.</p>
 */
@Entity
@Table(
    name = "sos_alert",
    indexes = {
        @Index(name = "idx_sos_company",  columnList = "company_id"),
        @Index(name = "idx_sos_status",   columnList = "status"),
        @Index(name = "idx_sos_company_status", columnList = "company_id,status"),
        @Index(name = "idx_sos_employee", columnList = "employee_id"),
        @Index(name = "idx_sos_triggered", columnList = "triggered_at")
    }
)
@Data
@AllArgsConstructor
@NoArgsConstructor
public class SosAlert {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "company_id", nullable = false)
    private Long companyId;

    /** Employé déclencheur du SOS. */
    @Column(name = "employee_id", nullable = false)
    private Long employeeId;

    /** Coordinateur ayant pris en charge (assigné au premier acknowledge). */
    @Column(name = "coordinator_id")
    private Long coordinatorId;

    /** Équipe de secours dispatchée. */
    @Column(name = "rescue_team_id")
    private Long rescueTeamId;

    /** Code raison : MEDICAL, AGRESSION, ACCIDENT_TRAVAIL, INCENDIE, AUTRE. */
    @Column(name = "reason_code", length = 40)
    private String reasonCode;

    /** Message libre saisi par l'employé. */
    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    /** Coordonnées GPS au déclenchement. */
    @Column(nullable = false)
    private Double latitude;

    @Column(nullable = false)
    private Double longitude;

    /** Précision GPS en mètres (telle que rapportée par le navigateur). */
    @Column(name = "gps_accuracy")
    private Float gpsAccuracy;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private SosStatus status = SosStatus.RECEIVED;

    /** Mode drill (exercice) : ne déclenche ni dispatch SMS ni audio sirène. */
    @Column(name = "drill_mode", nullable = false)
    private Boolean drillMode = false;

    /** Si l'alerte est marquée fausse alerte, raison fournie. */
    @Column(name = "false_alarm_reason", length = 200)
    private String falseAlarmReason;

    // ── Horodatages de transition (UTC, LocalDateTime — Hibernate géré) ──
    @Column(name = "triggered_at", nullable = false)
    private LocalDateTime triggeredAt;

    @Column(name = "acknowledged_at")
    private LocalDateTime acknowledgedAt;

    @Column(name = "dispatched_at")
    private LocalDateTime dispatchedAt;

    @Column(name = "on_site_at")
    private LocalDateTime onSiteAt;

    @Column(name = "closed_at")
    private LocalDateTime closedAt;

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
