package com.minexpert.hns.service.parameters;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.minexpert.hns.dto.parameters.MeasurementDTO;
import com.minexpert.hns.entity.parameters.Measurement;
import com.minexpert.hns.enums.Status;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.repository.parameters.MeasurementRepository;

@Service
@Transactional
public class MeasurementServiceImpl implements MeasurementService {

    @Autowired
    private MeasurementRepository measurementRepository;

    private void ensureCompanyIdProvided(Long companyId) throws HSException {
        if (companyId == null) {
            throw new HSException("COMPANY_ID_REQUIRED");
        }
    }

    /**
     * Mine effective pour une opération sur une entité EXISTANTE. Le paramètre
     * {@code companyId} prime s'il désigne une mine précise (utilisateur cloisonné) ;
     * sinon (admin « Toutes les Mines » en vue consolidée) on DÉRIVE la mine de l'entité.
     */
    private Long resolveOwningCompany(Long companyId, Measurement existing) throws HSException {
        Long effective = (companyId != null && companyId > 0) ? companyId : existing.getCompanyId();
        if (effective == null) {
            throw new HSException("COMPANY_ID_REQUIRED");
        }
        if (!effective.equals(existing.getCompanyId())) {
            throw new HSException("MEASUREMENT_NOT_FOUND");
        }
        return effective;
    }

    private Measurement loadMeasurement(Long companyId, Long id) throws HSException {
        return measurementRepository.findByIdWithCompanyContext(id, companyId)
                .orElseThrow(() -> new HSException("MEASUREMENT_NOT_FOUND"));
    }

    @Override
    @Caching(evict = {
            @CacheEvict(cacheNames = "measurementsAll", key = "#companyId != null ? #companyId : 'ALL'"),
            @CacheEvict(cacheNames = "measurementsActive", key = "#companyId != null ? #companyId : 'ALL'")
    })
    public Long addMeasurement(Long companyId, MeasurementDTO measurementDTO) throws HSException {
        ensureCompanyIdProvided(companyId);
        Optional<Measurement> optional = measurementRepository.findByCompanyIdAndNameIgnoreCase(companyId,
                measurementDTO.getName());
        if (optional.isPresent()) {
            throw new HSException("MEASUREMENT_ALREADY_EXISTS");
        }
        measurementDTO.setCompanyId(companyId);
        measurementDTO.setStatus(Status.ACTIVE);
        measurementDTO.setCreatedAt(LocalDateTime.now());
        measurementDTO.setUpdatedAt(LocalDateTime.now());
        return measurementRepository.save(measurementDTO.toEntity()).getId();
    }

    @Override
    @Caching(evict = {
            @CacheEvict(cacheNames = "measurementsAll", key = "#companyId != null ? #companyId : 'ALL'"),
            @CacheEvict(cacheNames = "measurementsActive", key = "#companyId != null ? #companyId : 'ALL'"),
            @CacheEvict(cacheNames = "measurementById", key = "#companyId != null && #measurementDTO.id != null ? (#companyId + '-' + #measurementDTO.id) : 'ALL-' + #measurementDTO.id", condition = "#measurementDTO.id != null")
    })
    public void updateMeasurement(Long companyId, MeasurementDTO measurementDTO) throws HSException {
        Measurement measurement = loadMeasurement(companyId, measurementDTO.getId());
        companyId = resolveOwningCompany(companyId, measurement);
        if (!measurementDTO.getName().equalsIgnoreCase(measurement.getName())) {
            Optional<Measurement> optional = measurementRepository.findByCompanyIdAndNameIgnoreCase(companyId,
                    measurementDTO.getName());
            if (optional.isPresent() && !optional.get().getId().equals(measurement.getId())) {
                throw new HSException("MEASUREMENT_ALREADY_EXISTS");
            }
        }

        measurement.setName(measurementDTO.getName());
        measurement.setDescription(measurementDTO.getDescription());
        measurement.setUnit(measurementDTO.getUnit());
        measurement.setNormalValue(measurementDTO.getNormalValue());
        measurement.setThreshold(measurementDTO.getThreshold());
        measurement.setCompanyId(companyId);
        measurement.setUpdatedAt(LocalDateTime.now());
        measurementRepository.save(measurement);
    }

    @Override
    @Caching(evict = {
            @CacheEvict(cacheNames = "measurementsAll", key = "#companyId != null ? #companyId : 'ALL'"),
            @CacheEvict(cacheNames = "measurementsActive", key = "#companyId != null ? #companyId : 'ALL'"),
            @CacheEvict(cacheNames = "measurementById", key = "#companyId != null ? (#companyId + '-' + #id) : 'ALL-' + #id")
    })
    public void deleteMeasurement(Long companyId, Long id) throws HSException {
        Measurement measurement = loadMeasurement(companyId, id);
        measurementRepository.delete(measurement);
    }

    @Override
    @Cacheable(cacheNames = "measurementById", key = "#companyId != null ? (#companyId + '-' + #id) : 'ALL-' + #id")
    public MeasurementDTO getMeasurementById(Long companyId, Long id) throws HSException {
        return loadMeasurement(companyId, id).toDTO();
    }

    @Override
    @Cacheable(cacheNames = "measurementsAll", key = "#companyId != null ? #companyId : 'ALL'")
    public List<MeasurementDTO> getAllMeasurements(Long companyId) throws HSException {
        List<Measurement> measurements = measurementRepository.findAllWithCompany(companyId);
        return measurements.stream().map(Measurement::toDTO).toList();
    }

    @Override
    @Cacheable(cacheNames = "measurementsActive", key = "#companyId != null ? #companyId : 'ALL'")
    public List<MeasurementDTO> getAllActiveMeasurements(Long companyId) throws HSException {
        List<Measurement> measurements = measurementRepository.findAllByStatus(companyId, Status.ACTIVE);
        return measurements.stream().map(Measurement::toDTO).toList();
    }

    @Override
    @Caching(evict = {
            @CacheEvict(cacheNames = "measurementsAll", key = "#companyId != null ? #companyId : 'ALL'"),
            @CacheEvict(cacheNames = "measurementsActive", key = "#companyId != null ? #companyId : 'ALL'"),
            @CacheEvict(cacheNames = "measurementById", key = "#companyId != null ? (#companyId + '-' + #id) : 'ALL-' + #id")
    })
    public void activateMeasurement(Long companyId, Long id) throws HSException {
        Measurement measurement = loadMeasurement(companyId, id);
        measurement.setStatus(Status.ACTIVE);
        measurement.setUpdatedAt(LocalDateTime.now());
        measurementRepository.save(measurement);
    }

    @Override
    @Caching(evict = {
            @CacheEvict(cacheNames = "measurementsAll", key = "#companyId != null ? #companyId : 'ALL'"),
            @CacheEvict(cacheNames = "measurementsActive", key = "#companyId != null ? #companyId : 'ALL'"),
            @CacheEvict(cacheNames = "measurementById", key = "#companyId != null ? (#companyId + '-' + #id) : 'ALL-' + #id")
    })
    public void deactivateMeasurement(Long companyId, Long id) throws HSException {
        Measurement measurement = loadMeasurement(companyId, id);
        measurement.setStatus(Status.INACTIVE);
        measurement.setUpdatedAt(LocalDateTime.now());
        measurementRepository.save(measurement);
    }

}
