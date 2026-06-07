package com.minexpert.hns.dosimetry.entity;

import java.time.LocalDateTime;

import com.minexpert.hns.dosimetry.enums.AlertLevel;
import com.minexpert.hns.dosimetry.enums.AlertStatus;
import com.minexpert.hns.dosimetry.enums.ThresholdGrandeur;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Alerte d'exposition declenchee par franchissement d'un seuil (Threshold).
 */
@Entity
@Table(name = "dosimetry_exposure_alert",
        indexes = {
                @Index(name = "idx_alert_worker_status", columnList = "worker_id, status"),
                @Index(name = "idx_alert_triggered_at", columnList = "triggered_at")
        })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExposureAlert {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "worker_id", nullable = false)
    private Long workerId;

    @Column(name = "zone_id")
    private Long zoneId;

    @Enumerated(EnumType.STRING)
    @Column(name = "level", nullable = false, length = 32)
    private AlertLevel level;

    @Enumerated(EnumType.STRING)
    @Column(name = "grandeur", nullable = false, length = 16)
    private ThresholdGrandeur grandeur;

    @Column(name = "value", nullable = false)
    private Double value;

    @Column(name = "threshold_id", nullable = false)
    private Long thresholdId;

    @Column(name = "triggered_at", nullable = false)
    private LocalDateTime triggeredAt;

    @Column(name = "acknowledged_at")
    private LocalDateTime acknowledgedAt;

    @Column(name = "acknowledged_by")
    private Long acknowledgedBy;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 16)
    private AlertStatus status;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "created_by")
    private Long createdBy;

    @Column(name = "updated_by")
    private Long updatedBy;
}
