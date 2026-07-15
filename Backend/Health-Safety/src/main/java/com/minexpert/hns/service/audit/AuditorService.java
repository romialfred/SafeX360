package com.minexpert.hns.service.audit;

import java.util.List;

import com.minexpert.hns.dto.audit.AuditorDTO;
import com.minexpert.hns.exception.HSException;

public interface AuditorService {
    public Long addAuditor(AuditorDTO auditorDTO) throws HSException;

    public List<Long> addAuditors(List<AuditorDTO> auditorDTOs, Long auditId) throws HSException;

    public List<Long> addOrUpdateAuditors(List<AuditorDTO> auditorDTOs, Long auditId) throws HSException;

    public void updateAuditor(AuditorDTO auditorDTO) throws HSException;

    public void deleteAuditor(Long id) throws HSException;

    public AuditorDTO getAuditorById(Long id) throws HSException;

    public List<AuditorDTO> getAuditorsByAuditId(Long auditId) throws HSException;

    public List<AuditorDTO> getLeadAuditorsForPlanning(Long companyId) throws HSException;

    public List<AuditorDTO> getLeadAuditors(Long companyId) throws HSException;

}
