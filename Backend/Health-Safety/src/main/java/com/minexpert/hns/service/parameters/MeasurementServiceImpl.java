package com.minexpert.hns.service.parameters;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
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

    @Override
    public Long addMeasurement(MeasurementDTO measurementDTO) throws HSException {
        Optional<Measurement> optional = measurementRepository.findByNameIgnoreCase(measurementDTO.getName());
        if (optional.isPresent()) {
            throw new HSException("MEASUREMENT_ALREADY_EXISTS");
        }
        measurementDTO.setStatus(Status.ACTIVE);
        measurementDTO.setCreatedAt(LocalDateTime.now());
        measurementDTO.setUpdatedAt(LocalDateTime.now());
        return measurementRepository.save(measurementDTO.toEntity()).getId();
    }

    @Override
    public void updateMeasurement(MeasurementDTO measurementDTO) throws HSException {
        Measurement measurement = measurementRepository.findById(measurementDTO.getId())
                .orElseThrow(() -> new HSException("MEASUREMENT_NOT_FOUND"));
        if (!measurementDTO.getName().equalsIgnoreCase(measurement.getName())) {
            Optional<Measurement> optional = measurementRepository.findByNameIgnoreCase(measurementDTO.getName());
            if (optional.isPresent() && !optional.get().getId().equals(measurement.getId())) {
                throw new HSException("MEASUREMENT_ALREADY_EXISTS");
            }
        }

        measurement.setName(measurementDTO.getName());
        measurement.setDescription(measurementDTO.getDescription());
        measurement.setUnit(measurementDTO.getUnit());
        measurement.setUpdatedAt(LocalDateTime.now());
        measurement.setThreshold(measurementDTO.getThreshold());
        measurementRepository.save(measurement);
    }

    @Override
    public void deleteMeasurement(Long id) {
        measurementRepository.deleteById(id);
    }

    @Override
    public MeasurementDTO getMeasurementById(Long id) throws HSException {
        // TODO Auto-generated method stub
        throw new UnsupportedOperationException("Unimplemented method 'getMeasurementById'");
    }

    @Override
    public List<MeasurementDTO> getAllMeasurements() throws HSException {
        List<Measurement> measurements = (List<Measurement>) measurementRepository.findAll();
        return measurements.stream().map(Measurement::toDTO).toList();
    }

    @Override
    public List<MeasurementDTO> getAllActiveMeasurements() throws HSException {
        List<Measurement> measurements = (List<Measurement>) measurementRepository.findByStatus(Status.ACTIVE);
        return measurements.stream().map(Measurement::toDTO).toList();
    }

    @Override
    public void activateMeasurement(Long id) throws HSException {
        Measurement measurement = measurementRepository.findById(id)
                .orElseThrow(() -> new HSException("MEASUREMENT_NOT_FOUND"));
        measurement.setStatus(Status.ACTIVE);
        measurementRepository.save(measurement);
    }

    @Override
    public void deactivateMeasurement(Long id) throws HSException {
        Measurement measurement = measurementRepository.findById(id)
                .orElseThrow(() -> new HSException("MEASUREMENT_NOT_FOUND"));
        measurement.setStatus(Status.INACTIVE);
        measurementRepository.save(measurement);
    }

}
