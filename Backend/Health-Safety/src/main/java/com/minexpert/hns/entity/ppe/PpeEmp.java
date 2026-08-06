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
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@Builder
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

    // ── Incrément 2 : la ligne porte désormais des QUANTITÉS ────────────────────
    // Avant, PpeEmp était le produit cartésien empIds×ppeIds sans quantité (même
    // liste pour tous, 1 unité implicite). Ces trois colonnes permettent enfin
    // « employé A → 2 gants, employé B → 1 casque », et séparent les étapes du
    // cycle de vie (demandé / approuvé / distribué) comme l'exige la mission.
    /** Quantité demandée pour ce bénéficiaire et cet EPI. */
    private Integer quantityRequested;
    /** Quantité réellement approuvée (peut être < demandée). */
    private Integer quantityApproved;
    /** Quantité effectivement sortie du stock / distribuée. */
    private Integer quantityIssued;
    /** Quantité retournée (remise en stock ou réformée) — incrément 4. */
    private Integer quantityReturned;

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
        // Builder : plus de constructeur positionnel (fin du piège d'arité Lombok).
        return PpeEmpDTO.builder()
                .id(id).empId(empId)
                .ppeId(ppe != null ? ppe.getId() : null)
                .ppeRequestId(ppeRequest != null ? ppeRequest.getId() : null)
                .status(status)
                .quantityRequested(quantityRequested).quantityApproved(quantityApproved)
                .quantityIssued(quantityIssued).quantityReturned(quantityReturned)
                .date(date).createdAt(createdAt).updatedAt(updatedAt).companyId(companyId)
                .build();
    }
}
