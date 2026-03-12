package com.minexpert.hns.service.audit;

import java.util.List;

import com.minexpert.hns.dto.audit.AreaDTO;
import com.minexpert.hns.dto.audit.AreaDetails;

public interface AreaService {
    public Long createArea(AreaDTO areaDTO);

    public List<Long> createAreas(List<AreaDTO> areaDTOs, Long auditId);

    public AreaDTO getAreaById(Long id);

    public List<AreaDTO> getAreasByAuditId(Long auditId);

    public List<AreaDetails> getAreaDetailsByAuditId(Long auditId);
}
