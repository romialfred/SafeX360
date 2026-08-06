package com.minexpert.hns.service.ppe;

import com.minexpert.hns.dto.ppe.dotation.DotationDetailDTO;
import com.minexpert.hns.dto.ppe.dotation.DotationListDTO;
import com.minexpert.hns.dto.ppe.dotation.DotationSummaryDTO;
import com.minexpert.hns.exception.HSException;

public interface PpeDotationService {

    /** KPI + répartition par statut, sur la mine. */
    DotationSummaryDTO getSummary(Long companyId) throws HSException;

    /** Liste paginée/filtrée/triée des employés suivis + options de filtres. */
    DotationListDTO getEmployees(Long companyId, String search, String status, String department,
            String function, String sort, int page, int size) throws HSException;

    /** Fiche détaillée d'un employé (volet). */
    DotationDetailDTO getEmployeeDetail(Long companyId, Long empId) throws HSException;
}
