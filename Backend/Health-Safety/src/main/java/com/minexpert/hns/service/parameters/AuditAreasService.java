package com.minexpert.hns.service.parameters;

import java.util.List;

import com.minexpert.hns.dto.parameters.AuditAreasDTO;
import com.minexpert.hns.exception.HSException;

public interface AuditAreasService {
    Long addAuditArea(Long companyId, AuditAreasDTO auditAreasDTO) throws HSException;

    void updateAuditArea(Long companyId, AuditAreasDTO auditAreasDTO) throws HSException;

    void deleteAuditArea(Long companyId, Long id) throws HSException;

    AuditAreasDTO getAuditAreaById(Long companyId, Long id) throws HSException;

    List<AuditAreasDTO> getAllAuditAreas(Long companyId) throws HSException;

    List<AuditAreasDTO> getAllActiveAuditAreas(Long companyId) throws HSException;

    void activateAuditArea(Long companyId, Long id) throws HSException;

    void deactivateAuditArea(Long companyId, Long id) throws HSException;
}
