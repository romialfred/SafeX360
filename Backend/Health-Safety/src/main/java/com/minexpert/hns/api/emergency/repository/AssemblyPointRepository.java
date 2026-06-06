package com.minexpert.hns.api.emergency.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.minexpert.hns.api.emergency.entity.AssemblyPoint;

/**
 * Repository pour {@link AssemblyPoint} (LOT 48 Phase 2).
 */
public interface AssemblyPointRepository extends JpaRepository<AssemblyPoint, Long> {

    List<AssemblyPoint> findByCompanyIdOrderByEvacuationPriorityAscNameAsc(Long companyId);

    List<AssemblyPoint> findByCompanyIdAndStatusOrderByEvacuationPriorityAscNameAsc(
        Long companyId, String status
    );
}
