package com.minexpert.hns.service.parameters;

import java.util.List;

import com.minexpert.hns.dto.parameters.MeasurementDTO;
import com.minexpert.hns.exception.HSException;

public interface MeasurementService {
    Long addMeasurement(Long companyId, MeasurementDTO measurementDTO) throws HSException;

    void updateMeasurement(Long companyId, MeasurementDTO measurementDTO) throws HSException;

    void deleteMeasurement(Long companyId, Long id) throws HSException;

    MeasurementDTO getMeasurementById(Long companyId, Long id) throws HSException;

    List<MeasurementDTO> getAllMeasurements(Long companyId) throws HSException;

    List<MeasurementDTO> getAllActiveMeasurements(Long companyId) throws HSException;

    void activateMeasurement(Long companyId, Long id) throws HSException;

    void deactivateMeasurement(Long companyId, Long id) throws HSException;
}
