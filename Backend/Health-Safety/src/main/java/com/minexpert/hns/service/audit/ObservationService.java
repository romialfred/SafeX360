package com.minexpert.hns.service.audit;

import java.util.List;

import com.minexpert.hns.dto.audit.ObservationDTO;
import com.minexpert.hns.dto.response.ObsTitle;
import com.minexpert.hns.exception.HSException;

public interface ObservationService {
    public Long createObservation(ObservationDTO observationDTO) throws HSException;

    public void updateObservation(ObservationDTO observationDTO) throws HSException;

    public List<ObservationDTO> getAllObservationsByAuditId(Long auditId) throws HSException;

    public List<ObsTitle> getObservationTitlesByAuditId(Long auditId) throws HSException;
}
