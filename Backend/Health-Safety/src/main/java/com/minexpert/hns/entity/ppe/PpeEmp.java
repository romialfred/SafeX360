package com.minexpert.hns.entity.ppe;

import java.time.LocalDate;
import java.time.LocalDateTime;

import com.minexpert.hns.dto.ppe.PpeEmpDTO;

import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
public class PpeEmp {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long empId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ppe_id", nullable = false)
    private Ppe ppe;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ppe_request_id", nullable = false)
    private PpeRequest ppeRequest;

    @Enumerated(EnumType.STRING)
    private PpeEmpStatus status;

    private LocalDate date;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Cloisonnement par mine (companyId). Alimenté par le CompanyScopeFilter via le controller.
    private Long companyId;

    @PrePersist
    public void prePersist() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    public void preUpdate() {
        updatedAt = LocalDateTime.now();
    }

    /** Convert entity to DTO */
    public PpeEmpDTO toDTO() {
        return new PpeEmpDTO(id, empId, ppe != null ? ppe.getId() : null,
                ppeRequest != null ? ppeRequest.getId() : null, status, date, createdAt, updatedAt, companyId);
    }
}
