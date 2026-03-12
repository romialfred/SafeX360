package com.hrms.service;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.hrms.DataInterface.PositionResponse;
import com.hrms.dto.PositionDTO;
import com.hrms.entity.Position;
import com.hrms.exception.HRMSException;
import com.hrms.repository.PositionRepository;

import jakarta.transaction.Transactional;

@Service
@Transactional
public class PositionServiceImpl implements PositionService {

    @Autowired
    private PositionRepository positionRepository;

    @Override
    public void addPosition(PositionDTO positionDTO) throws HRMSException {
        if (positionRepository.findByNameIgnoreCaseAndCompany_IdAndPositionCategory_Id(positionDTO.getName(),
                positionDTO.getCompany().getId(), positionDTO.getPositionCategory().getId()).isPresent())
            throw new HRMSException("POSITION_ALREADY_EXISTS");
        positionRepository.save(positionDTO.toEntity());
    }

    @Override
    public PositionDTO getPosition(Long id) throws HRMSException {
        return positionRepository.findById(id).orElseThrow(() -> new HRMSException("POSITION_NOT_FOUND")).toDTO();
    }

    @Override
    public void updatePosition(PositionDTO positionDTO) throws HRMSException {
        positionRepository.findById(positionDTO.getId()).orElseThrow(() -> new HRMSException("POSITION_NOT_FOUND"));
        Optional<Position> optional = positionRepository.findByNameIgnoreCaseAndCompany_IdAndPositionCategory_Id(
                positionDTO.getName(), positionDTO.getCompany().getId(), positionDTO.getPositionCategory().getId());
        if (optional.isPresent() && optional.get().getId() != positionDTO.getId())
            throw new HRMSException("POSITION_ALREADY_EXISTS");
        positionRepository.save(positionDTO.toEntity());
    }

    @Override
    public List<PositionDTO> getAllPositions() {
        return ((List<Position>) positionRepository.findAll()).stream().map(position -> position.toDTO()).toList();
    }

    @Override
    public List<PositionResponse> getAllPositionNames() throws HRMSException {

        return positionRepository.findAllPositionNames();
    }

    @Override
    public PositionResponse getPositionById(Long id) throws HRMSException {
        return positionRepository.findPositionById(id)
                .orElseThrow(() -> new HRMSException("POSITION_NOT_FOUND"));
    }

}
