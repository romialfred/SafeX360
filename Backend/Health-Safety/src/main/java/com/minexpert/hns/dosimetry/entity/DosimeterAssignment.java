package com.minexpert.hns.dosimetry.entity;

import java.time.LocalDate;
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
 * Affectation d'un dosimetre a un travailleur pour une periode donnee, avec accuse de
 * reception (handover) et accuse de retour (return).
 */
@Entity
@Table(name = "dosimetry_dosimeter_assignment")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DosimeterAssignment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "dosimeter_id", nullable = false)
    private Dosimeter dosimeter;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "worker_id", nullable = false)
    private ExposedWorker worker;

    @Column(name = "period_start", nullable = false)
    private LocalDate periodStart;

    @Column(name = "period_end")
    private LocalDate periodEnd;

    @Column(name = "handover_ack", nullable = false)
    private boolean handoverAck;

    @Column(name = "handover_ack_at")
    private LocalDateTime handoverAckAt;

    @Column(name = "return_ack", nullable = false)
    private boolean returnAck;

    @Column(name = "return_ack_at")
    private LocalDateTime returnAckAt;

    @Column(name = "device_condition", length = 512)
    private String deviceCondition;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "created_by")
    private Long createdBy;

    @Column(name = "updated_by")
    private Long updatedBy;
}
