package com.minexpert.hns.dosimetry.service;

import java.util.List;

import com.minexpert.hns.dosimetry.dto.MeasurementPointDTO;
import com.minexpert.hns.dosimetry.enums.ZoneClass;

public interface MeasurementPointService {

    Long create(MeasurementPointDTO dto, Long userId);

    void update(Long id, MeasurementPointDTO dto, Long userId);

    MeasurementPointDTO getById(Long id);

    List<MeasurementPointDTO> listByMine(Long mineId);

    List<MeasurementPointDTO> listByZone(Long mineId, ZoneClass zoneClassification);

    void activate(Long id, Long userId);

    void deactivate(Long id, Long userId);
}
