package com.minexpert.hns.dosimetry.repository;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.minexpert.hns.dosimetry.entity.AmbientMeasurement;

@Repository
public interface AmbientMeasurementRepository extends JpaRepository<AmbientMeasurement, Long> {

    List<AmbientMeasurement> findByMeasurementPointIdOrderByMeasuredAtDesc(Long measurementPointId);

    List<AmbientMeasurement> findByCampaignIdOrderByMeasuredAtDesc(Long campaignId);

    List<AmbientMeasurement> findByMineIdAndMeasuredAtBetweenOrderByMeasuredAtDesc(
            Long mineId, LocalDateTime from, LocalDateTime to);

    @Query("SELECT a FROM AmbientMeasurement a "
            + "WHERE a.measurementPointId = :pointId "
            + "AND a.measuredAt BETWEEN :from AND :to "
            + "ORDER BY a.measuredAt DESC")
    List<AmbientMeasurement> findByPointAndRange(@Param("pointId") Long pointId,
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to);

    @Query("SELECT a FROM AmbientMeasurement a "
            + "WHERE a.measurementPointId = :pointId "
            + "ORDER BY a.measuredAt DESC")
    List<AmbientMeasurement> findLatestByPoint(@Param("pointId") Long pointId,
            org.springframework.data.domain.Pageable pageable);
}
