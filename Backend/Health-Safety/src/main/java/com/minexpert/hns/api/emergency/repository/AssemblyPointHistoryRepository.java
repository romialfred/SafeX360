package com.minexpert.hns.api.emergency.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.minexpert.hns.api.emergency.entity.AssemblyPointHistory;

/**
 * Repository pour {@link AssemblyPointHistory} (LOT 48 Phase 2).
 */
public interface AssemblyPointHistoryRepository extends JpaRepository<AssemblyPointHistory, Long> {

    List<AssemblyPointHistory> findByAssemblyPointIdOrderByCreatedAtDesc(Long assemblyPointId);

    List<AssemblyPointHistory> findByCompanyIdOrderByCreatedAtDesc(Long companyId);
}
