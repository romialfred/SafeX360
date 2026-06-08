package com.minexpert.hns.blast.entity;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Rapport d'evacuation cloturant un tir confirme : declenchement de l'alerte,
 * comptage presents/manquants, delai d'evacuation, heure du tir et du "site
 * degage", incidents eventuels, validation signee.
 *
 * <p>Relation 1-1 avec {@link Blast} (un seul rapport par tir).
 */
@Entity
@Table(name = "blast_evacuation_report",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_blast_evac_report_blast", columnNames = {"blast_id"})
        })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BlastEvacuationReport {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "blast_id", nullable = false)
    private Long blastId;

    @Column(name = "alarm_triggered_at")
    private LocalDateTime alarmTriggeredAt;

    @Column(name = "mustered_count")
    private Integer musteredCount;

    @Column(name = "missing_count")
    private Integer missingCount;

    @Column(name = "evac_duration_seconds")
    private Integer evacDurationSeconds;

    @Column(name = "fired_at")
    private LocalDateTime firedAt;

    @Column(name = "all_clear_at")
    private LocalDateTime allClearAt;

    @Column(name = "incidents", columnDefinition = "TEXT")
    private String incidents;

    @Column(name = "signed_off_by")
    private Long signedOffBy;

    @Column(name = "signed_at")
    private LocalDateTime signedAt;
}
