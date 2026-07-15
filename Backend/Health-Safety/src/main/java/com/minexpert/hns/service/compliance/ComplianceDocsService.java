package com.minexpert.hns.service.compliance;

import java.util.List;

import com.minexpert.hns.dto.compliance.ComplianceDocsDTO;
import com.minexpert.hns.dto.compliance.DocResponse;
import com.minexpert.hns.dto.compliance.EmpAssignResponse;
import com.minexpert.hns.dto.request.EmpEmailPosResponse;
import com.minexpert.hns.exception.HSException;

public interface ComplianceDocsService {

    public Long saveComplianceDoc(ComplianceDocsDTO complianceDocsDTO) throws HSException;

    public DocResponse getDocDetails(Long id, Long companyId) throws HSException;

    public List<DocResponse> getAllComplianceDocs(Long companyId) throws HSException;

    public List<EmpEmailPosResponse> getAllEmpEmailPos() throws HSException;

    public List<DocResponse> getComplianceDocsByEmployeeId(Long employeeId) throws HSException;

    public EmpAssignResponse getRequirementsByEmpId(Long employeeId) throws HSException;

    public void approveComplianceDoc(Long id) throws HSException;

    public void rejectComplianceDoc(Long id, String comment) throws HSException;

}
