package com.minexpert.hns.repository.parameters;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;
import org.springframework.data.repository.query.Param;

import com.minexpert.hns.entity.parameters.Measurement;
import com.minexpert.hns.enums.Status;

public interface MeasurementRepository extends CrudRepository<Measurement, Long> {
    Optional<Measurement> findByCompanyIdAndNameIgnoreCase(Long companyId, String name);

    @Query("SELECT m FROM Measurement m WHERE (:companyId IS NULL OR m.companyId = :companyId)")
    List<Measurement> findAllWithCompany(@Param("companyId") Long companyId);

    @Query("SELECT m FROM Measurement m WHERE m.status = :status AND (:companyId IS NULL OR m.companyId = :companyId)")
    List<Measurement> findAllByStatus(@Param("companyId") Long companyId, @Param("status") Status status);

    @Query("SELECT m FROM Measurement m WHERE m.id = :id AND (:companyId IS NULL OR m.companyId = :companyId)")
    Optional<Measurement> findByIdWithCompanyContext(@Param("id") Long id, @Param("companyId") Long companyId);
}
