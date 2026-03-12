package com.minexpert.hns.service.inspections;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.minexpert.hns.dto.inspections.InspectionHistoryDTO;
import com.minexpert.hns.entity.GeneralInspection;
import com.minexpert.hns.entity.inspections.InspectionHistory;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.repository.inspections.InspectionHistoryRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class InspectionHistoryServiceImpl implements InspectionHistoryService {

    private final InspectionHistoryRepository inspectionHistoryRepository;
    private final GeneralInspectionService generalInspectionService;

    @Override
    public Long saveInspectionHistory(InspectionHistoryDTO inspectionHistoryDTO) throws HSException {
        inspectionHistoryDTO.setCreatedAt(LocalDateTime.now());
        generalInspectionService.updateInspectionStatus(inspectionHistoryDTO.getInspectionId(),
                inspectionHistoryDTO.getStatus());
        return inspectionHistoryRepository.save(inspectionHistoryDTO.toEntity()).getId();
    }

    @Override
    public List<InspectionHistoryDTO> getInspectionHistoryByInspectionId(Long inspectionId) throws HSException {
        List<InspectionHistory> histories = inspectionHistoryRepository.findByInspectionId(inspectionId);
        return histories.stream().map(h -> new InspectionHistoryDTO(
                h.getId(),
                h.getOwnerId(),
                h.getDate(),
                h.getStatus(),
                h.getComment(),
                h.getInspection() != null ? h.getInspection().getId() : null,
                h.getCreatedAt())).collect(Collectors.toList());
    }
}
