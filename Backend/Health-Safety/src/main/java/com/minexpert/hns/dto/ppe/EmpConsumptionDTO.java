package com.minexpert.hns.dto.ppe;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Consommation EPI agrégée d'un employé (page « Mes EPI ») : quantité distribuée et
 * coût cumulé (Σ distribué × prix de référence). Sert aux comparaisons entre pairs
 * (département / poste / ensemble) calculées côté client à partir des profils RH.
 */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class EmpConsumptionDTO {
    private Long empId;
    private long quantity;
    private double cost;
}
