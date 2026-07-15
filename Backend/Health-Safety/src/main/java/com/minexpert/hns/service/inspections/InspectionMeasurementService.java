package com.minexpert.hns.service.inspections;

import java.util.List;

import com.minexpert.hns.dto.inspections.InspectionMeasurementDTO;
import com.minexpert.hns.exception.HSException;

public interface InspectionMeasurementService {
    Long createMeasurement(InspectionMeasurementDTO measurementDTO) throws HSException;

    InspectionMeasurementDTO getMeasurementById(Long id) throws HSException;

    void updateMeasurement(InspectionMeasurementDTO measurementDTO) throws HSException;

    void deleteMeasurement(Long id) throws HSException;

    List<InspectionMeasurementDTO> getAllMeasurement() throws HSException;

    List<InspectionMeasurementDTO> getMeasurementByInspectionId(Long inspectionId, Long companyId) throws HSException;
}
