package com.minexpert.hns.service.parameters;

import java.util.List;

import com.minexpert.hns.dto.parameters.InternalAuditorDTO;
import com.minexpert.hns.dto.parameters.InternalAuditorResponse;
import com.minexpert.hns.exception.HSException;

public interface InternalAuditorService {
    public Long createInternalAuditor(InternalAuditorDTO internalAuditorDTO) throws HSException;

    public void updateInternalAuditor(InternalAuditorDTO internalAuditorDTO) throws HSException;

    public void activateInternalAuditor(Long id) throws HSException;

    public void deactivateInternalAuditor(Long id) throws HSException;

    public List<InternalAuditorResponse> getAllInternalAuditors() throws HSException;

}
