package com.minexpert.hns.service.ppe;

import com.minexpert.hns.dto.ppe.EmpConsumptionDTO;

import java.util.List;

public interface PpeMineService {

    /** Consommation & coût EPI agrégés par employé d'une mine (base des comparaisons « Mes EPI »). */
    List<EmpConsumptionDTO> getConsumptionByEmployee(Long companyId);
}
