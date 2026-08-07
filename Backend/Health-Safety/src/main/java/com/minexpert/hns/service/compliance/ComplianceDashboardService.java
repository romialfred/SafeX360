package com.minexpert.hns.service.compliance;

import java.time.LocalDate;
import com.minexpert.hns.dto.compliance.dashboard.ComplianceDashboardActionItemsResponse;
import com.minexpert.hns.dto.compliance.dashboard.ComplianceDashboardCompliantEmployeesResponse;
import com.minexpert.hns.dto.compliance.dashboard.ComplianceDashboardDepartmentSummaryResponse;
import com.minexpert.hns.dto.compliance.dashboard.ComplianceDashboardOverallStatusResponse;
import com.minexpert.hns.exception.HSException;

public interface ComplianceDashboardService {

    ComplianceDashboardActionItemsResponse getActionItems(Long companyId) throws HSException;

    void sendActionItemAlert(Long employeeId, Long requirementId) throws HSException;

    ComplianceDashboardDepartmentSummaryResponse getDepartmentSummary(LocalDate asOf, Long companyId)
            throws HSException;

    ComplianceDashboardOverallStatusResponse getOverallStatus(Long departmentId, Long companyId)
            throws HSException;

    ComplianceDashboardCompliantEmployeesResponse getCompliantEmployees(Integer page, Integer pageSize,
            String departmentFilter,
            String employeeFilter, Long companyId) throws HSException;
}
