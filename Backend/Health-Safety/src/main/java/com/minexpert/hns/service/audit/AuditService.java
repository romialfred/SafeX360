package com.minexpert.hns.service.audit;

import java.util.List;

import com.minexpert.hns.dto.audit.AuditDTO;
import com.minexpert.hns.dto.audit.AuditDetails;
import com.minexpert.hns.dto.audit.AuditRequest;
import com.minexpert.hns.dto.audit.ExecuteRequest;
import com.minexpert.hns.enums.AuditStatus;
import com.minexpert.hns.exception.HSException;

public interface AuditService {

    public Long createAudit(AuditRequest request) throws HSException;

    public void updateAudit(AuditRequest request) throws HSException;

    public void executeAudit(ExecuteRequest request) throws HSException;

    public Long createAudit(AuditDTO auditDTO) throws HSException;

    public void updateAudit(AuditDTO auditDTO) throws HSException;

    public AuditDTO getAudit(Long id) throws HSException;

    public AuditDetails getAuditDetails(Long id) throws HSException;

    public List<AuditDTO> getAllAudits(Long companyId) throws HSException;

    public void updateAuditStatus(Long id, AuditStatus status) throws HSException;

    public List<AuditDTO> getAllPlanningAudits(Long companyId) throws HSException;

    public void approvePlanning(Long id) throws HSException;

    public void rejectPlanning(Long id) throws HSException;

}
