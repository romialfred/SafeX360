package com.minexpert.hns.api.emergency.entity;

import java.time.LocalDateTime;

import com.minexpert.hns.api.emergency.enums.CheckInStatus;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Pointage d'un employé à un point de rassemblement lors d'une Alerte
 * Générale (LOT 48 Phase 4).
 *
 * <p>Un check-in est une preuve qu'un employé est en sécurité (SAFE), blessé
 * (INJURED) ou déclaré manquant (MISSING) par un tiers. La contrainte unique
 * {@code (alert_id, employee_id)} garantit qu'un employé ne pointe qu'une
 * seule fois par alerte (l'update se fait via reuse de la ligne).</p>
 */
@Entity
@Table(
    name = "evacuation_check_in",
    uniqueConstraints = @UniqueConstraint(
        name = "uq_evac_alert_employee",
        columnNames = {"general_alert_id", "employee_id"}
    ),
    indexes = {
        @Index(name = "idx_evac_alert",    columnList = "general_alert_id"),
        @Index(name = "idx_evac_employee", columnList = "employee_id"),
        @Index(name = "idx_evac_ap",       columnList = "assembly_point_id")
    }
)
@Data
@AllArgsConstructor
@NoArgsConstructor
public class EvacuationCheckIn {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "general_alert_id", nullable = false)
    private Long generalAlertId;

    @Column(name = "employee_id", nullable = false)
    private Long employeeId;

    /** Point de rassemblement où l'employé s'est présenté. */
    @Column(name = "assembly_point_id")
    private Long assemblyPointId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private CheckInStatus status = CheckInStatus.SAFE;

    /** Coordonnées GPS au moment du check-in. */
    @Column
    private Double latitude;

    @Column
    private Double longitude;

    @Column(name = "gps_accuracy")
    private Float gpsAccuracy;

    /**
     * Utilisateur ayant fait le check-in (peut être l'employé lui-même ou un
     * tiers pour le statut {@code MISSING}).
     */
    @Column(name = "checked_by")
    private Long checkedBy;

    @Column(length = 300)
    private String note;

    @Column(name = "checked_at", nullable = false)
    private LocalDateTime checkedAt;

    @PrePersist
    void onCreate() {
        if (checkedAt == null) checkedAt = LocalDateTime.now();
    }
}
