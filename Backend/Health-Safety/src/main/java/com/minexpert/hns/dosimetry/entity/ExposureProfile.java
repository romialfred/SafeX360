package com.minexpert.hns.dosimetry.entity;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Profil d'exposition d'un travailleur (type de rayonnement, zone, poste, frequence, conditions).
 */
@Entity
@Table(name = "dosimetry_exposure_profile")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExposureProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "worker_id", nullable = false)
    private ExposedWorker worker;

    /** Ex. "EXTERNAL_RADIATION". */
    @Column(name = "exposure_type", nullable = false, length = 64)
    private String exposureType;

    @Column(name = "zone_id")
    private Long zoneId;

    @Column(name = "post_id")
    private Long postId;

    @Column(name = "frequency", length = 64)
    private String frequency;

    @Column(name = "conditions", length = 2048)
    private String conditions;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "created_by")
    private Long createdBy;

    @Column(name = "updated_by")
    private Long updatedBy;
}
