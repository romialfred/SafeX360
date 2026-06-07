package com.minexpert.hns.dosimetry.dto;

import java.time.LocalDateTime;

import com.minexpert.hns.dosimetry.enums.AlertLevel;
import com.minexpert.hns.dosimetry.enums.AlertStatus;
import com.minexpert.hns.dosimetry.enums.DoseCategory;
import com.minexpert.hns.dosimetry.enums.ThresholdGrandeur;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * DTO enrichi d'alerte : ajoute les infos worker (employeeId, mineId, category) afin que le
 * centre d'alerte du frontend puisse afficher la liste sans appel supplementaire.
 *
 * <p>Utilise par les endpoints {@code /active?mineId=} et {@code /active-by-worker/{id}} de
 * la Phase 5. Le nom et matricule "humain" du worker restent obtenus separement via le module RH
 * (l'enrichissement RBAC nominatif n'est pas effectue ici pour respecter la separation des
 * responsabilites entre modules).
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ExposureAlertEnrichedDTO {

    // --- Alert fields ---
    private Long id;
    private Long workerId;
    private Long zoneId;
    private AlertLevel level;
    private ThresholdGrandeur grandeur;
    private Double value;
    private Long thresholdId;
    private LocalDateTime triggeredAt;
    private LocalDateTime acknowledgedAt;
    private Long acknowledgedBy;
    private AlertStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Long createdBy;
    private Long updatedBy;

    // --- Worker enrichment ---
    private Long employeeId;
    private Long mineId;
    private DoseCategory workerCategory;
}
