package com.minexpert.hns.dto.ppe;

import com.minexpert.hns.entity.ppe.Ppe;
import com.minexpert.hns.entity.ppe.PpeStock;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class PpeStockDTO {
    private Long id;
    private Long ppeId;
    private Integer quantity;
    private Double unitPrice;
    private String supplier;
    private String brand;
    private String model;
    private String size;
    private LocalDate expiryDate;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public PpeStock toEntity() {
        return new PpeStock(id, new Ppe(ppeId), quantity, unitPrice, supplier, brand, model, size, expiryDate,
                createdAt,
                updatedAt);
    }

}
