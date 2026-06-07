package com.minexpert.hns.dosimetry.entity;

import java.time.LocalDateTime;

import com.minexpert.hns.dosimetry.enums.DoseSource;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Enregistrement de dose individuelle.
 *
 * <p><b>IMPORTANT - APPEND-ONLY :</b> aucun champ metier n'est mis a jour apres creation.
 * Toute modification donne lieu a un nouvel enregistrement (version + 1) qui reference le
 * precedent via supersededRecordId. Seul supersededRecordId reste mutable pour permettre de
 * marquer un enregistrement comme remplace (chainage). Les colonnes ci-dessous portent donc
 * updatable=false a l'exception explicite de supersededRecordId.
 *
 * <p>period : "YYYY-MM" (mensuel) ou "YYYY-Qx" (trimestriel selon mode de releve agence).
 */
@Entity
@Table(name = "dosimetry_dose_record",
        indexes = {
                @Index(name = "idx_dose_record_worker_period", columnList = "worker_id, period"),
                @Index(name = "idx_dose_record_superseded", columnList = "superseded_record_id")
        })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DoseRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "worker_id", nullable = false, updatable = false)
    private ExposedWorker worker;

    @Column(name = "period", nullable = false, updatable = false, length = 16)
    private String period;

    @Column(name = "hp10", updatable = false)
    private Double hp10;

    @Column(name = "hp007", updatable = false)
    private Double hp007;

    @Column(name = "hp3", updatable = false)
    private Double hp3;

    @Enumerated(EnumType.STRING)
    @Column(name = "source", nullable = false, updatable = false, length = 16)
    private DoseSource source;

    @Column(name = "below_detection", nullable = false, updatable = false)
    private boolean belowDetection;

    /** JSON array des URLs de pieces jointes (bulletins agence, certificats EPD, etc.). */
    @Column(name = "attachment_urls", updatable = false, columnDefinition = "TEXT")
    private String attachmentUrls;

    @Column(name = "notes", updatable = false, length = 2048)
    private String notes;

    @Column(name = "recorded_by", nullable = false, updatable = false)
    private Long recordedBy;

    @Column(name = "recorded_at", nullable = false, updatable = false)
    private LocalDateTime recordedAt;

    /** Toujours incremente de +1 sur chaque nouvelle "edition" (qui cree en realite un nouveau record). */
    @Column(name = "version", nullable = false, updatable = false)
    private int version;

    /** Reference vers l'enregistrement remplace (chainage). Seul champ mutable. */
    @Column(name = "superseded_record_id")
    private Long supersededRecordId;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", updatable = false)
    private LocalDateTime updatedAt;

    @Column(name = "created_by", updatable = false)
    private Long createdBy;

    @Column(name = "updated_by", updatable = false)
    private Long updatedBy;
}
