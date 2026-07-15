package com.minexpert.hns.service.inspections;

import java.util.List;

import com.minexpert.hns.dto.inspections.InspectionHistoryDTO;
import com.minexpert.hns.exception.HSException;

public interface InspectionHistoryService {
    Long saveInspectionHistory(InspectionHistoryDTO inspectionHistoryDTO) throws HSException;

    List<InspectionHistoryDTO> getInspectionHistoryByInspectionId(Long inspectionId, Long companyId)
            throws HSException;
}
