package com.minexpert.hns.repository.incident;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.minexpert.hns.entity.incident.WorkedHours;

public interface WorkedHoursRepository extends JpaRepository<WorkedHours, Long> {

    Optional<WorkedHours> findByCompanyIdAndYearAndMonth(Long companyId, Integer year, Integer month);

    List<WorkedHours> findByCompanyIdAndYearOrderByMonthAsc(Long companyId, Integer year);

    /** Somme des heures d'une année, cloisonnée mine (dénominateur des taux). */
    @Query("SELECT COALESCE(SUM(w.hours), 0) FROM WorkedHours w "
            + "WHERE w.year = :year AND (:companyId IS NULL OR w.companyId = :companyId)")
    Double sumHoursForYear(@Param("year") int year, @Param("companyId") Long companyId);
}
