package com.minexpert.hns.api.emergency.repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.minexpert.hns.api.emergency.entity.RescueWeeklyPlanning;

/**
 * Repository pour {@link RescueWeeklyPlanning} (LOT 48 Phase 1.c.2).
 */
public interface RescueWeeklyPlanningRepository extends JpaRepository<RescueWeeklyPlanning, Long> {

    /** Planning d'une semaine précise pour une mine (clé unique). */
    Optional<RescueWeeklyPlanning> findByCompanyIdAndWeekStartDate(Long companyId, LocalDate weekStartDate);

    /** Plannings d'une mine, plus récents en premier. */
    List<RescueWeeklyPlanning> findByCompanyIdOrderByWeekStartDateDesc(Long companyId);

    /** Plannings d'une mine entre deux dates (semaines visibles dans la fenêtre courante). */
    List<RescueWeeklyPlanning> findByCompanyIdAndWeekStartDateBetweenOrderByWeekStartDateAsc(
        Long companyId, LocalDate from, LocalDate to
    );
}
