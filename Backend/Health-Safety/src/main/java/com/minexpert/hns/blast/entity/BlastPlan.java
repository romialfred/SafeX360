package com.minexpert.hns.blast.entity;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Plan de tir : nombre de trous, diametre, profondeur, charge specifique et
 * sequence de retards. Relation 1-1 avec {@link Blast}.
 */
@Entity
@Table(name = "blast_plan",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_blast_plan_blast", columnNames = {"blast_id"})
        })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BlastPlan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "blast_id", nullable = false)
    private Blast blast;

    @Column(name = "hole_count")
    private Integer holeCount;

    @Column(name = "hole_diameter_mm")
    private Double holeDiameterMm;

    @Column(name = "depth_m")
    private Double depthM;

    @Column(name = "burden_m")
    private Double burdenM;

    @Column(name = "spacing_m")
    private Double spacingM;

    @Column(name = "stemming_m")
    private Double stemmingM;

    @Column(name = "explosive_type", length = 64)
    private String explosiveType;

    @Column(name = "explosive_qty_kg")
    private Double explosiveQtyKg;

    /** kg/m3 — charge specifique (powder factor). */
    @Column(name = "powder_factor")
    private Double powderFactor;

    @Column(name = "initiation_system", length = 64)
    private String initiationSystem;

    /** Texte libre ou JSON : sequence de retards des detonateurs. */
    @Column(name = "delay_sequence", columnDefinition = "TEXT")
    private String delaySequence;

    @Column(name = "created_at")
    private LocalDateTime createdAt;
}
