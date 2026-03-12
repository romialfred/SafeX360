package com.minexpert.hns.service.parameters;

import java.util.List;

import com.minexpert.hns.dto.parameters.AuditAreasDTO;
import com.minexpert.hns.exception.HSException;

public interface AuditAreasService {
    public Long addAuditArea(AuditAreasDTO auditAreasDTO) throws HSException;

    public void updateAuditArea(AuditAreasDTO auditAreasDTO) throws HSException;

    public void deleteAuditArea(Long id) throws HSException;

    public AuditAreasDTO getAuditAreaById(Long id) throws HSException;

    public List<AuditAreasDTO> getAllAuditAreas() throws HSException;

    public List<AuditAreasDTO> getAllActiveAuditAreas() throws HSException;

    public void activateAuditArea(Long id) throws HSException;

    public void deactivateAuditArea(Long id) throws HSException;
}
