package com.minexpert.hns.dosimetry.entity;

import java.time.LocalDate;
import java.time.LocalDateTime;

import com.minexpert.hns.dosimetry.enums.DoseCategory;
import com.minexpert.hns.dosimetry.enums.DoseSpecialStatus;

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
 * Travailleur expose aux rayonnements ionisants.
 * FK virtuelle employeeId -> Employee (module RH).
 */
@Entity
@Table(name = "dosimetry_exposed_worker")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExposedWorker {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "employee_id", nullable = false)
    private Long employeeId;

    @Enumerated(EnumType.STRING)
    @Column(name = "category", nullable = false, length = 16)
    private DoseCategory category;

    @Column(name = "classification_reason", length = 1024)
    private String classificationReason;

    @Column(name = "classification_date")
    private LocalDate classificationDate;

    @Column(name = "rpo_id")
    private Long rpoId;

    @Enumerated(EnumType.STRING)
    @Column(name = "special_status", length = 32)
    private DoseSpecialStatus specialStatus;

    @Column(name = "special_status_start_date")
    private LocalDate specialStatusStartDate;

    @Column(name = "special_status_end_date")
    private LocalDate specialStatusEndDate;

    @Column(name = "active", nullable = false)
    private boolean active;

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
