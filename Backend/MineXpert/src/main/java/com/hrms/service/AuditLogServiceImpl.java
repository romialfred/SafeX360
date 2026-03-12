package com.hrms.service;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.hrms.dto.AuditLogDTO;
import com.hrms.exception.HRMSException;
import com.hrms.repository.AuditLogRepository;

@Service
public class AuditLogServiceImpl implements AuditLogService {

    @Autowired
    private AuditLogRepository auditLogRepository;

    @Override
    public void logAudit(AuditLogDTO auditLogDTO) throws HRMSException {
        auditLogRepository.save(auditLogDTO.toEntity());
    }

    @Override
    public AuditLogDTO getAuditLog(Long id) throws HRMSException {
        // TODO Auto-generated method stub
        throw new UnsupportedOperationException("Unimplemented method 'getAuditLog'");
    }

    @Override
    public List<AuditLogDTO> getAllLogs() {
        // TODO Auto-generated method stub
        throw new UnsupportedOperationException("Unimplemented method 'getAllLogs'");
    }
    
}
