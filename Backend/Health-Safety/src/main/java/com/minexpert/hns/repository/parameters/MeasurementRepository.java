package com.minexpert.hns.repository.parameters;

import java.util.List;
import java.util.Optional;

import org.springframework.data.repository.CrudRepository;

import com.minexpert.hns.entity.parameters.Measurement;
import com.minexpert.hns.enums.Status;

public interface MeasurementRepository extends CrudRepository<Measurement, Long> {
    Optional<Measurement> findByNameIgnoreCase(String name);

    List<Measurement> findByStatus(Status status);
}
