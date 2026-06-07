package com.minexpert.hns.dosimetry.entity;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import com.minexpert.hns.dosimetry.enums.MeasurementContext;

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
 * Mesure ponctuelle de debit de dose ambiant H*(10) en uSv/h sur un point fixe.
 *
 * <p><b>APPEND-ONLY :</b> les champs metier (value, measuredAt, measurementPointId,
 * instrumentId, instrumentSerial, context, campaignId, measuredBy, mineId) portent
 * {@code updatable=false}. La defense en profondeur cote BDD est assuree par le trigger
 * {@code trg_dosimetry_ambient_measurement_no_update} (cf. V007).
 */
@Entity
@Table(name = "dosimetry_ambient_measurement",
        indexes = {
                @Index(name = "idx_ambient_point_measured_at",
                        columnList = "measurement_point_id, measured_at DESC"),
                @Index(name = "idx_ambient_campaign", columnList = "campaign_id"),
                @Index(name = "idx_ambient_mine_measured_at",
                        columnList = "mine_id, measured_at")
        })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AmbientMeasurement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "mine_id", nullable = false, updatable = false)
    private Long mineId;

    @Column(name = "measurement_point_id", nullable = false, updatable = false)
    private Long measurementPointId;

    @Column(name = "measured_at", nullable = false, updatable = false)
    private LocalDateTime measuredAt;

    @Column(name = "measured_by", nullable = false, updatable = false)
    private Long measuredBy;

    /** Valeur de H*(10) en uSv/h. APPEND-ONLY. */
    @Column(name = "value", nullable = false, updatable = false, precision = 14, scale = 4)
    private BigDecimal value;

    /** Incertitude relative en pourcentage (0..100). */
    @Column(name = "uncertainty", updatable = false, precision = 6, scale = 2)
    private BigDecimal uncertainty;

    /** FK vers le dosimetre (typiquement type SURVEY_METER). */
    @Column(name = "instrument_id", updatable = false)
    private Long instrumentId;

    /** Snapshot du numero de serie de l'instrument au moment de la mesure (tracabilite). */
    @Column(name = "instrument_serial", updatable = false, length = 64)
    private String instrumentSerial;

    @Enumerated(EnumType.STRING)
    @Column(name = "context", nullable = false, updatable = false, length = 32)
    private MeasurementContext context;

    /** FK vers MonitoringCampaign si la mesure est rattachee a une campagne. */
    @Column(name = "campaign_id", updatable = false)
    private Long campaignId;

    @Column(name = "notes", updatable = false, columnDefinition = "TEXT")
    private String notes;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "created_by", updatable = false)
    private Long createdBy;
}
