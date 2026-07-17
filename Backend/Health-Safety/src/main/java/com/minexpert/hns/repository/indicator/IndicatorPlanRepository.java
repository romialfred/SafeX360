package com.minexpert.hns.repository.indicator;

import java.util.Optional;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;
import org.springframework.data.repository.query.Param;

import com.minexpert.hns.entity.indicator.IndicatorPlan;

public interface IndicatorPlanRepository extends CrudRepository<IndicatorPlan, Long> {

    @Query("SELECT p FROM IndicatorPlan p WHERE p.indicatorId = :indicatorId AND p.year = :year "
            + "AND (:companyId IS NULL OR p.companyId = :companyId)")
    Optional<IndicatorPlan> findByContext(@Param("companyId") Long companyId,
            @Param("indicatorId") Long indicatorId, @Param("year") Integer year);

    @Query("SELECT p FROM IndicatorPlan p WHERE p.id = :id AND (:companyId IS NULL OR p.companyId = :companyId)")
    Optional<IndicatorPlan> findByIdWithCompanyContext(@Param("id") Long id, @Param("companyId") Long companyId);
}
