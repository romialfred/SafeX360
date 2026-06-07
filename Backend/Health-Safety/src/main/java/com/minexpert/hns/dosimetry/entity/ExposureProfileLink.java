package com.minexpert.hns.dosimetry.entity;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Lien Worker (via ExposureProfile) x MeasurementPoint avec fraction de temps passe sur le point.
 *
 * <p>La somme des fractions d'un meme profil doit etre &lt;= 1 (controle service).
 * Le champ {@code estimatedDoseRate} est un snapshot recalcule (moyenne recente sur le point)
 * pour faciliter l'affichage rapide ; la valeur d'autorite reste le calcul a la volee.
 */
@Entity
@Table(name = "dosimetry_exposure_profile_link",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_exposure_profile_link_profile_point",
                        columnNames = {"exposure_profile_id", "measurement_point_id"})
        },
        indexes = {
                @Index(name = "idx_exposure_profile_link_profile",
                        columnList = "exposure_profile_id"),
                @Index(name = "idx_exposure_profile_link_point",
                        columnList = "measurement_point_id")
        })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExposureProfileLink {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "exposure_profile_id", nullable = false)
    private Long exposureProfileId;

    @Column(name = "measurement_point_id", nullable = false)
    private Long measurementPointId;

    /** Fraction de temps passee sur le point (0..1). */
    @Column(name = "fraction", nullable = false, precision = 6, scale = 4)
    private BigDecimal fraction;

    /** Snapshot du debit de dose moyen estime sur le point (uSv/h). */
    @Column(name = "estimated_dose_rate", precision = 14, scale = 4)
    private BigDecimal estimatedDoseRate;

    @Column(name = "last_updated")
    private LocalDateTime lastUpdated;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "created_by")
    private Long createdBy;
}
