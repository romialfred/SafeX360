package com.minexpert.hns.dosimetry.entity;

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
 * Cumuls dosimetriques d'un travailleur : annuel, glissant 5 ans, vie entiere.
 * Materialise/recalcule par un job a partir de DoseRecord (snapshot).
 */
@Entity
@Table(name = "dosimetry_dose_cumulative",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_dose_cumulative_worker_year", columnNames = {"worker_id", "year"})
        },
        indexes = {
                @Index(name = "idx_dose_cumulative_worker_year", columnList = "worker_id, year")
        })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DoseCumulative {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "worker_id", nullable = false)
    private Long workerId;

    @Column(name = "year", nullable = false)
    private int year;

    @Column(name = "annual_hp10")
    private Double annualHp10;

    @Column(name = "annual_hp007")
    private Double annualHp007;

    @Column(name = "annual_hp3")
    private Double annualHp3;

    @Column(name = "rolling5y_hp10")
    private Double rolling5yHp10;

    @Column(name = "lifetime_hp10")
    private Double lifetimeHp10;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
