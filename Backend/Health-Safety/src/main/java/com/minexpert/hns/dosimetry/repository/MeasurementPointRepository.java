package com.minexpert.hns.dosimetry.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.minexpert.hns.dosimetry.entity.MeasurementPoint;
import com.minexpert.hns.dosimetry.enums.ZoneClass;

@Repository
public interface MeasurementPointRepository extends JpaRepository<MeasurementPoint, Long> {

    List<MeasurementPoint> findByMineId(Long mineId);

    List<MeasurementPoint> findByMineIdAndActive(Long mineId, boolean active);

    List<MeasurementPoint> findByMineIdAndZoneClassification(Long mineId, ZoneClass zoneClassification);

    Optional<MeasurementPoint> findByMineIdAndCode(Long mineId, String code);

    boolean existsByMineIdAndCode(Long mineId, String code);
}
