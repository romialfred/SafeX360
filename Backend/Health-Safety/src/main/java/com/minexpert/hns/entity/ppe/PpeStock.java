package com.minexpert.hns.entity.ppe;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

import com.minexpert.hns.dto.ppe.PpeStockDTO;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
public class PpeStock {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Many stock records can belong to one PPE
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ppe_id", nullable = false)
    private Ppe ppe;

    private Integer quantity;
    private Double unitPrice;
    private String supplier;
    private String brand;
    private String model;
    private String size;

    private LocalDate expiryDate;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Cloisonnement par mine (companyId). Alimenté par le CompanyScopeFilter via le controller.
    private Long companyId;

    public PpeStockDTO toDTO() {
        return new PpeStockDTO(id, ppe != null ? ppe.getId() : null, quantity, unitPrice, supplier, brand, model, size,
                expiryDate,
                createdAt, updatedAt, companyId);
    }
}
