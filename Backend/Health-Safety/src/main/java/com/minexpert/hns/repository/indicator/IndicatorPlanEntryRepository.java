package com.minexpert.hns.repository.indicator;

import java.util.List;

import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;
import org.springframework.data.repository.query.Param;

import com.minexpert.hns.entity.indicator.IndicatorPlanEntry;

public interface IndicatorPlanEntryRepository extends CrudRepository<IndicatorPlanEntry, Long> {

    List<IndicatorPlanEntry> findByPlanIdOrderByPeriodIndexAsc(Long planId);

    @Modifying
    @Query("DELETE FROM IndicatorPlanEntry e WHERE e.planId = :planId")
    void deleteByPlanId(@Param("planId") Long planId);
}
