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
            @CacheEvict(cacheNames = "inspectionMeasurementsByInspection", allEntries = true)
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
    public void deleteMeasurement(Long id, Long companyId) throws HSException {
        // Cloisonnement par mine : refuse de supprimer une mesure rattachée à une
        // inspection d'une autre mine (le companyId réel est porté par l'inspection).
        InspectionMeasurement measurement = inspectionMeasurementRepository.findById(id)
                .orElseThrow(() -> new HSException("MEASUREMENT_NOT_FOUND"));
        if (companyId != null) {
            Long owner = measurement.getGeneralInspection() != null
                    ? measurement.getGeneralInspection().getCompanyId() : null;
            if (owner == null || !companyId.equals(owner)) {
                throw new HSException("MEASUREMENT_NOT_FOUND");
            }
        }
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
    @Cacheable(cacheNames = "inspectionMeasurementsByInspection", key = "#inspectionId + '-' + #companyId")
    public List<InspectionMeasurementDTO> getMeasurementByInspectionId(Long inspectionId, Long companyId)
            throws HSException {
        return ((List<InspectionMeasurement>) inspectionMeasurementRepository
                .findByInspectionAndCompany(inspectionId, companyId))
                .stream()
                .map(InspectionMeasurement::toDTO)
                .toList();
    }

}
