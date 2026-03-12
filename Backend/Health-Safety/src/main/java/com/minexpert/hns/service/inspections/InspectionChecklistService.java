package com.minexpert.hns.service.inspections;

import java.util.List;

import com.minexpert.hns.dto.inspections.InspectionChecklistDTO;
import com.minexpert.hns.exception.HSException;

public interface InspectionChecklistService {
    Long createChecklist(InspectionChecklistDTO checklistDTO) throws HSException;

    InspectionChecklistDTO getChecklistById(Long id) throws HSException;

    void updateChecklist(InspectionChecklistDTO checklistDTO) throws HSException;

    void deleteChecklist(Long id) throws HSException;

    List<InspectionChecklistDTO> getAllChecklists() throws HSException;

    List<InspectionChecklistDTO> getChecklistsByInspectionId(Long inspectionId) throws HSException;
}
