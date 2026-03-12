package com.minexpert.hns.service.parameters;

import java.util.List;

import com.minexpert.hns.dto.parameters.MeasurementDTO;
import com.minexpert.hns.exception.HSException;

public interface MeasurementService {
    Long addMeasurement(MeasurementDTO measurementDTO) throws HSException;

    void updateMeasurement(MeasurementDTO measurementDTO) throws HSException;

    void deleteMeasurement(Long id);

    MeasurementDTO getMeasurementById(Long id) throws HSException;

    List<MeasurementDTO> getAllMeasurements() throws HSException;

    List<MeasurementDTO> getAllActiveMeasurements() throws HSException;

    void activateMeasurement(Long id) throws HSException;

    void deactivateMeasurement(Long id) throws HSException;
}
