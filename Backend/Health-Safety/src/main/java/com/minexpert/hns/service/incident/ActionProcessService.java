package com.minexpert.hns.service.incident;

import java.util.List;

import com.minexpert.hns.dto.ActionProcessDTO;
import com.minexpert.hns.dto.response.ActionProcessResponse;
import com.minexpert.hns.exception.HSException;

public interface ActionProcessService {
    public Long addActionProcess(ActionProcessDTO actionProcessDTO) throws HSException;

    public List<ActionProcessResponse> getActionProcessByActionId(Long actionId) throws HSException;

}
