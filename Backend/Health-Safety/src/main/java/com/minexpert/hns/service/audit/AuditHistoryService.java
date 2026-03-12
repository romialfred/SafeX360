package com.minexpert.hns.service.audit;

import java.util.List;

import com.minexpert.hns.dto.audit.AuditHistoryDTO;
import com.minexpert.hns.exception.HSException;

public interface AuditHistoryService {
    Long saveAuditHistory(AuditHistoryDTO auditHistoryDTO) throws HSException;

    List<AuditHistoryDTO> getAuditHistoryByAuditId(Long auditId) throws HSException;

}
