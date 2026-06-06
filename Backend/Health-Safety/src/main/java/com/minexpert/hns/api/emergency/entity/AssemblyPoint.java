package com.minexpert.hns.api.emergency.entity;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
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
 * Point de rassemblement (LOT 48 Phase 1 — sera complété Phase 2 avec CRUD UI).
 *
 * <p>Géolocalisé, rattaché à une mine, avec responsable et adjoint, départements
 * couverts (n-n via table jointure), et priorité d'évacuation (1 = la plus
 * haute, 5 = la plus basse).</p>
 */
@Entity
@Table(
    name = "assembly_point",
    indexes = {
        @Index(name = "idx_ap_company", columnList = "company_id"),
        @Index(name = "idx_ap_status",  columnList = "status")
    }
)
@Data
@AllArgsConstructor
@NoArgsConstructor
public class AssemblyPoint {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 120)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "location_text")
    private String locationText;

    @Column(nullable = false)
    private Double latitude;

    @Column(nullable = false)
    private Double longitude;

    @Column(name = "manager_id")
    private Long managerId;

    @Column(name = "deputy_manager_id")
    private Long deputyManagerId;

    /** Caméra associée (FK future — V2). */
    @Column(name = "camera_id")
    private Long cameraId;

    /** Priorité d'évacuation 1..5 (1 = la plus prioritaire). */
    @Column(name = "evacuation_priority", nullable = false)
    private Integer evacuationPriority = 2;

    @Column(name = "max_capacity")
    private Integer maxCapacity;

    @Column(nullable = false, length = 20)
    private String status = "ACTIVE";

    @Column(name = "company_id", nullable = false)
    private Long companyId;

    /**
     * Départements couverts par ce point.
     *
     * <p>Phase 1 : stocké en CSV simple ("12,15,18") pour respecter la contrainte
     * Aiven {@code sql_require_primary_key} qui interdit les tables sans PK
     * (les {@code @ElementCollection} Hibernate génèrent des tables sans PK).</p>
     *
     * <p>Phase 2 : sera remplacé par une sous-entité {@code AssemblyPointDepartment}
     * dédiée avec {@code @Id} synthétique + {@code unique(assembly_point_id, department_id)}.</p>
     */
    @Column(name = "department_ids", length = 500)
    private String departmentIdsCsv;

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
