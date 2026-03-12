package com.hrms.service;

import java.util.List;

import com.hrms.DataInterface.PositionResponse;
import com.hrms.dto.PositionDTO;
import com.hrms.exception.HRMSException;

public interface PositionService {
    public void addPosition(PositionDTO positionDTO) throws HRMSException;

    public PositionDTO getPosition(Long id) throws HRMSException;

    public void updatePosition(PositionDTO positionDTO) throws HRMSException;

    public List<PositionDTO> getAllPositions();

    public List<PositionResponse> getAllPositionNames() throws HRMSException;

    public PositionResponse getPositionById(Long id) throws HRMSException;
}
