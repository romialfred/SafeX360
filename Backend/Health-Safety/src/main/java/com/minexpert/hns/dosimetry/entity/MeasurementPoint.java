package com.minexpert.hns.dosimetry.entity;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import com.minexpert.hns.dosimetry.enums.ZoneClass;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import jakarta.persistence.Version;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Point fixe de mesure d'ambiance pour la surveillance du debit de dose ambiant H*(10).
 *
 * <p>Identifie de maniere unique par le couple (mineId, code) afin d'autoriser un meme code
 * fonctionnel sur plusieurs mines. La desactivation est gere via le flag {@link #active}
 * (soft delete) car les mesures historiques associees doivent etre preservees (AIEA GSR Part 3).
 */
@Entity
@Table(name = "dosimetry_measurement_point",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_measurement_point_mine_code",
                        columnNames = {"mine_id", "code"})
        },
        indexes = {
                @Index(name = "idx_measurement_point_mine_zone_class",
                        columnList = "mine_id, zone_classification"),
                @Index(name = "idx_measurement_point_mine_active",
                        columnList = "mine_id, active")
        })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MeasurementPoint {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "mine_id", nullable = false)
    private Long mineId;

    /** Code fonctionnel (unique par mine). Ex. "MP-GAL-001". */
    @Column(name = "code", nullable = false, length = 64)
    private String code;

    @Column(name = "label", nullable = false, length = 255)
    private String label;

    /** FK vers Zone (module Workforce). Nullable (pas tous les points sont rattaches). */
    @Column(name = "zone_id")
    private Long zoneId;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    /** Localisation textuelle libre (ex. "Galerie Nord, niveau -240, PK 1+250"). */
    @Column(name = "location", columnDefinition = "TEXT")
    private String location;

    @Column(name = "latitude", precision = 10, scale = 7)
    private BigDecimal latitude;

    @Column(name = "longitude", precision = 10, scale = 7)
    private BigDecimal longitude;

    @Column(name = "elevation", precision = 10, scale = 2)
    private BigDecimal elevation;

    @Enumerated(EnumType.STRING)
    @Column(name = "zone_classification", nullable = false, length = 16)
    private ZoneClass zoneClassification;

    /** Niveau de reference local (uSv/h). Sert de baseline pour declencher une alerte ambiance. */
    @Column(name = "reference_level", precision = 12, scale = 4)
    private BigDecimal referenceLevel;

    @Column(name = "active", nullable = false)
    private boolean active;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "created_by")
    private Long createdBy;

    @Column(name = "updated_by")
    private Long updatedBy;

    /** Verrouillage optimiste. */
    @Version
    @Column(name = "version", nullable = false)
    private Long version;
}
