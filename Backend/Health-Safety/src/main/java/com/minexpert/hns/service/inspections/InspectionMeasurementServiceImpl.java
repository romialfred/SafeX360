package com.minexpert.hns.service.inspections;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.minexpert.hns.dto.inspections.InspectionMeasurementDTO;
import com.minexpert.hns.entity.inspections.InspectionMeasurement;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.repository.inspections.InspectionMeasurementRepository;

@Service
@Transactional
public class InspectionMeasurementServiceImpl implements InspectionMeasurementService {

    @Autowired
    private InspectionMeasurementRepository inspectionMeasurementRepository;

    @Override
    @Caching(evict = {
            // @CacheEvict(cacheNames = "inspectionMeasurementById", allEntries = true),
            @CacheEvict(cacheNames = "inspectionMeasurementsAll", allEntries = true),
            @CacheEvict(cacheNames = "inspectionMeasurementsByInspection", key = "#measurementDTO.inspectionId", condition = "#measurementDTO.inspectionId != null")
    })
    public Long createMeasurement(InspectionMeasurementDTO measurementDTO) throws HSException {
        measurementDTO.setCreatedAt(LocalDateTime.now());
        measurementDTO.setUpdatedAt(LocalDateTime.now());
        return inspectionMeasurementRepository.save(measurementDTO.toEntity()).getId();
    }

    @Override
    @Cacheable(cacheNames = "inspectionMeasurementById", key = "#id")
    public InspectionMeasurementDTO getMeasurementById(Long id) throws HSException {
        return inspectionMeasurementRepository.findById(id)
                .orElseThrow(() -> new HSException("MEASUREMENT_NOT_FOUND")).toDTO();
    }

    @Override
    @Caching(evict = {
            @CacheEvict(cacheNames = "inspectionMeasurementById", key = "#measurementDTO.id"),
            @CacheEvict(cacheNames = "inspectionMeasurementsAll", allEntries = true),
            @CacheEvict(cacheNames = "inspectionMeasurementsByInspection", allEntries = true)
    })
    public void updateMeasurement(InspectionMeasurementDTO measurementDTO) throws HSException {
        InspectionMeasurement existingMeasurement = inspectionMeasurementRepository.findById(measurementDTO.getId())
                .orElseThrow(() -> new HSException("MEASUREMENT_NOT_FOUND"));
        existingMeasurement.setValue(measurementDTO.getValue());
        existingMeasurement.setUpdatedAt(LocalDateTime.now());
        inspectionMeasurementRepository.save(existingMeasurement);
    }

    @Override
    @Caching(evict = {
            @CacheEvict(cacheNames = "inspectionMeasurementById", key = "#id"),
            @CacheEvict(cacheNames = "inspectionMeasurementsAll", allEntries = true),
            @CacheEvict(cacheNames = "inspectionMeasurementsByInspection", allEntries = true)
    })
    public void deleteMeasurement(Long id) throws HSException {
        inspectionMeasurementRepository.deleteById(id);
    }

    @Override
    @Cacheable(cacheNames = "inspectionMeasurementsAll")
    public List<InspectionMeasurementDTO> getAllMeasurement() throws HSException {
        return ((List<InspectionMeasurement>) inspectionMeasurementRepository.findAll()).stream()
                .map(InspectionMeasurement::toDTO)
                .toList();
    }

    @Override
    @Cacheable(cacheNames = "inspectionMeasurementsByInspection", key = "#inspectionId")
    public List<InspectionMeasurementDTO> getMeasurementByInspectionId(Long inspectionId) throws HSException {
        return ((List<InspectionMeasurement>) inspectionMeasurementRepository.findByGeneralInspection_Id(inspectionId))
                .stream()
                .map(InspectionMeasurement::toDTO)
                .toList();
    }

}
