package com.hrms.service;

import java.util.List;

import com.hrms.dto.AuditLogDTO;
import com.hrms.exception.HRMSException;

public interface AuditLogService {
        public void logAudit(AuditLogDTO auditLogDTO) throws HRMSException;
    public AuditLogDTO getAuditLog(Long id) throws HRMSException;
    public List<AuditLogDTO> getAllLogs();
}
