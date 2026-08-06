package com.minexpert.hns.dto.ppe.dotation;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

/** Un EPI attribué à un employé (carte du volet détail). */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class DotationEquipmentDTO {
    private Long ppeId;
    private String name;
    private String category;
    private String categoryLabel;
    private String brand;
    private String model;
    private String size;
    private long quantity;
    private LocalDate lastDate;      // dernière dotation
    private LocalDate expiryDate;    // date + durée de vie
    private Integer renewalDays;     // jours avant expiration (négatif = dépassé)
    /** BON / A_RENOUVELER / EXPIRE / RETOURNE */
    private String state;
    private boolean mandatory;
}
