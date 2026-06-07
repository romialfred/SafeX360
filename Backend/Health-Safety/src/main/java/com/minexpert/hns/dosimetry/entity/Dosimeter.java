package com.minexpert.hns.dosimetry.entity;

import java.time.LocalDate;
import java.time.LocalDateTime;

import com.minexpert.hns.dosimetry.enums.DosimeterStatus;
import com.minexpert.hns.dosimetry.enums.DosimeterType;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Dosimetre physique (parc de mesure).
 */
@Entity
@Table(name = "dosimetry_dosimeter")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Dosimeter {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "serial", nullable = false, unique = true, length = 64)
    private String serial;

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false, length = 16)
    private DosimeterType type;

    @Column(name = "qr_code", length = 255)
    private String qrCode;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 32)
    private DosimeterStatus status;

    @Column(name = "calibration_due_date")
    private LocalDate calibrationDueDate;

    @Column(name = "mine_id", nullable = false)
    private Long mineId;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "created_by")
    private Long createdBy;

    @Column(name = "updated_by")
    private Long updatedBy;
}
