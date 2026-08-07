package com.minexpert.hns.api.compliance;

import java.time.LocalDate;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.minexpert.hns.dto.ResponseDTO;
import com.minexpert.hns.dto.compliance.dashboard.ComplianceDashboardActionItemsResponse;
import com.minexpert.hns.dto.compliance.dashboard.ComplianceDashboardAlertRequest;
import com.minexpert.hns.dto.compliance.dashboard.ComplianceDashboardCompliantEmployeesResponse;
import com.minexpert.hns.dto.compliance.dashboard.ComplianceDashboardDepartmentSummaryResponse;
import com.minexpert.hns.dto.compliance.dashboard.ComplianceDashboardOverallStatusResponse;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.service.compliance.ComplianceDashboardService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/compliance/dashboard")
@CrossOrigin
@Validated
@RequiredArgsConstructor
public class ComplianceDashboardAPI {

    private final ComplianceDashboardService complianceDashboardService;

    @GetMapping("/action-items")
    public ResponseEntity<ComplianceDashboardActionItemsResponse> getActionItems(
            @RequestParam(required = false) Long companyId) throws HSException {
        return ResponseEntity.ok(complianceDashboardService.getActionItems(companyId));
    }

    @PostMapping("/action-items/notify")
    public ResponseEntity<ResponseDTO> sendActionItemAlert(
            @Validated @RequestBody ComplianceDashboardAlertRequest request)
            throws HSException {
        complianceDashboardService.sendActionItemAlert(request.employeeId(), request.requirementId());
        return ResponseEntity.ok(new ResponseDTO("Alert sent successfully"));
    }

    @GetMapping("/department-summary")
    public ResponseEntity<ComplianceDashboardDepartmentSummaryResponse> getDepartmentSummary(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate asOf,
            @RequestParam(required = false) Long companyId)
            throws HSException {
        return ResponseEntity.ok(complianceDashboardService.getDepartmentSummary(asOf, companyId));
    }

    @GetMapping("/overall-status")
    public ResponseEntity<ComplianceDashboardOverallStatusResponse> getOverallStatus(
            @RequestParam(required = false) Long departmentId,
            @RequestParam(required = false) Long companyId) throws HSException {
        return ResponseEntity.ok(complianceDashboardService.getOverallStatus(departmentId, companyId));
    }

    @GetMapping("/compliant-employees")
    public ResponseEntity<ComplianceDashboardCompliantEmployeesResponse> getCompliantEmployees(
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer pageSize,
            @RequestParam(required = false) String department,
            @RequestParam(required = false) String employee,
            @RequestParam(required = false) Long companyId) throws HSException {
        return ResponseEntity
                .ok(complianceDashboardService.getCompliantEmployees(page, pageSize, department, employee, companyId));
    }
}
