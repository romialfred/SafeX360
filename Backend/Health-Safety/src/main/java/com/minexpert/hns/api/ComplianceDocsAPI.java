package com.minexpert.hns.api;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.minexpert.hns.dto.ResponseDTO;
import com.minexpert.hns.dto.compliance.ComplianceDocsDTO;
import com.minexpert.hns.dto.compliance.DocResponse;
import com.minexpert.hns.dto.compliance.EmpAssignResponse;
import com.minexpert.hns.dto.request.EmpEmailPosResponse;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.service.compliance.ComplianceDocsService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/compliance-docs")
@CrossOrigin
@Validated
@RequiredArgsConstructor
public class ComplianceDocsAPI {
    private final ComplianceDocsService complianceDocsService;

    @PostMapping("/create")
    public ResponseEntity<Long> addComplianceDoc(@RequestBody ComplianceDocsDTO complianceDocRequest,
            @RequestParam(required = false) Long companyId)
            throws HSException {
        // Cloisonnement : la mine appelante validee prime sur le payload.
        if (companyId != null) {
            complianceDocRequest.setCompanyId(companyId);
        }
        return new ResponseEntity<>(complianceDocsService.saveComplianceDoc(complianceDocRequest), HttpStatus.CREATED);
    }

    @GetMapping("/getAll")
    public ResponseEntity<List<DocResponse>> getAllComplianceDocs(
            @RequestParam(required = false) Long companyId) throws HSException {
        return new ResponseEntity<>(complianceDocsService.getAllComplianceDocs(companyId), HttpStatus.OK);
    }

    @GetMapping("/getDocDetails/{id}")
    public ResponseEntity<DocResponse> getDocDetails(@PathVariable Long id,
            @RequestParam(required = false) Long companyId) throws HSException {
        return new ResponseEntity<>(complianceDocsService.getDocDetails(id, companyId), HttpStatus.OK);
    }

    @GetMapping("/getAllEmpStatus")
    public ResponseEntity<List<EmpEmailPosResponse>> getAllEmpEmailPos() throws HSException {
        return new ResponseEntity<>(complianceDocsService.getAllEmpEmailPos(), HttpStatus.OK);
    }

    @GetMapping("/getByEmployeeId/{employeeId}")
    public ResponseEntity<List<DocResponse>> getComplianceDocsByEmployeeId(@PathVariable Long employeeId)
            throws HSException {
        return new ResponseEntity<>(complianceDocsService.getComplianceDocsByEmployeeId(employeeId), HttpStatus.OK);
    }

    @GetMapping("/getRequirementsByEmpId/{employeeId}")
    public ResponseEntity<EmpAssignResponse> getRequirementsByEmpId(@PathVariable Long employeeId) throws HSException {
        return new ResponseEntity<>(complianceDocsService.getRequirementsByEmpId(employeeId), HttpStatus.OK);
    }

    @PutMapping("/approve/{id}")
    public ResponseEntity<ResponseDTO> approveComplianceDoc(@PathVariable Long id) throws HSException {
        complianceDocsService.approveComplianceDoc(id);
        return new ResponseEntity<>(new ResponseDTO("Document Approved Successfully"), HttpStatus.OK);
    }

    @PutMapping("/reject/{id}")
    public ResponseEntity<ResponseDTO> rejectComplianceDoc(@PathVariable Long id, @RequestParam String comment)
            throws HSException {
        complianceDocsService.rejectComplianceDoc(id, comment);
        return new ResponseEntity<>(new ResponseDTO("Document Rejected Successfully"), HttpStatus.OK);
    }
}
